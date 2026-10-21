import { Response } from "express";
import mongoose from "mongoose";

import Transaction from "../models/Transaction";
import Shares from "../models/Share";
import Company from "../models/Company";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

type TransactionType = "BUY" | "SELL" | "DIVIDEND";

interface AddTransactionBody {
  companyId: string;
  type: TransactionType;
  shareCount?: number | null;
  pricePerShare?: number | null;
  handlingFee?: number;
  date: string;
  notes?: string | null;
}

const recalculateShares = async (
  userId: string,
  companyId: string,
  session: mongoose.ClientSession
) => {
  const transactions = await Transaction.find({
    userId,
    companyId,
  })
    .sort({
      date: 1,
      createdAt: 1,
    })
    .session(session);

  let amount = 0;
  let totalCost = 0;

  for (const transaction of transactions) {
    if (transaction.type === "BUY") {
      const shareCount = transaction.shareCount ?? 0;

      amount += shareCount;
      totalCost += transaction.netAmount;

      transaction.realizedGain = 0;

      await transaction.save({ session });
    }

    if (transaction.type === "SELL") {
      const shareCount = transaction.shareCount ?? 0;

      if (shareCount > amount) {
        throw new Error(
          `Not enough shares to process sell transaction ${transaction._id}`
        );
      }

      const averageCost = amount > 0 ? totalCost / amount : 0;

      const costBasis = averageCost * shareCount;

      amount -= shareCount;
      totalCost -= costBasis;

      transaction.realizedGain =
        transaction.netAmount - costBasis;

      await transaction.save({ session });
    }

    if (transaction.type === "DIVIDEND") {
      transaction.realizedGain = 0;

      await transaction.save({ session });
    }
  }

  if (Math.abs(amount) < 0.00000001) {
    amount = 0;
  }

  if (Math.abs(totalCost) < 0.00000001) {
    totalCost = 0;
  }

  if (amount === 0) {
    await Shares.deleteOne({
      userId,
      companyId,
    }).session(session);

    return;
  }

  const avgCost = totalCost / amount;

  await Shares.findOneAndUpdate(
    {
      userId,
      companyId,
    },
    {
      $set: {
        amount,
        avgCost,
        totalCost,
      },
    },
    {
      upsert: true,
      new: true,
      session,
    }
  );
};

export const addTransaction = async (
  req: AuthenticatedRequest & {
    body: AddTransactionBody;
  },
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const {
      companyId,
      type,
      shareCount,
      pricePerShare,
      handlingFee = 0,
      date,
      notes = null,
    } = req.body;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    if (
      type !== "BUY" &&
      type !== "SELL" &&
      type !== "DIVIDEND"
    ) {
      return res.status(400).json({
        message: "Invalid transaction type",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "Transaction date is required",
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid transaction date",
      });
    }

    if (
      typeof handlingFee !== "number" ||
      !Number.isFinite(handlingFee) ||
      handlingFee < 0
    ) {
      return res.status(400).json({
        message: "Invalid handling fee",
      });
    }

    const companyExists = await Company.exists({
      _id: companyId,
    });

    if (!companyExists) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (type === "BUY" || type === "SELL") {
      if (
        shareCount == null ||
        !Number.isFinite(shareCount) ||
        shareCount <= 0
      ) {
        return res.status(400).json({
          message: "Share count must be greater than 0",
        });
      }

      if (
        pricePerShare == null ||
        !Number.isFinite(pricePerShare) ||
        pricePerShare <= 0
      ) {
        return res.status(400).json({
          message: "Price per share must be greater than 0",
        });
      }
    }

    if (type === "DIVIDEND") {
      if (
        shareCount != null &&
        (!Number.isFinite(shareCount) || shareCount < 0)
      ) {
        return res.status(400).json({
          message: "Invalid share count",
        });
      }

      if (
        pricePerShare != null &&
        (!Number.isFinite(pricePerShare) || pricePerShare < 0)
      ) {
        return res.status(400).json({
          message: "Invalid price per share",
        });
      }
    }

    let grossAmount = 0;
    let netAmount = 0;

    if (type === "BUY" || type === "SELL") {
      grossAmount =
        (shareCount as number) *
        (pricePerShare as number);

      if (type === "BUY") {
        netAmount = grossAmount + handlingFee;
      } else {
        netAmount = grossAmount - handlingFee;
      }
    }

    if (type === "DIVIDEND") {
      grossAmount = pricePerShare ?? 0;
      netAmount = grossAmount - handlingFee;
    }

    if (grossAmount < 0 || netAmount < 0) {
      return res.status(400).json({
        message: "Transaction amount cannot be negative",
      });
    }

    let createdTransaction;

    await session.withTransaction(async () => {
      const transaction = new Transaction({
        userId,
        companyId,
        type,
        shareCount:
          shareCount == null ? null : shareCount,
        pricePerShare:
          pricePerShare == null ? null : pricePerShare,
        handlingFee,
        grossAmount,
        netAmount,
        realizedGain: 0,
        date: parsedDate,
        notes,
      });

      createdTransaction = await transaction.save({
        session,
      });

      await recalculateShares(
        userId,
        companyId,
        session
      );
    });

    const populatedTransaction =
      await Transaction.findById(createdTransaction!._id)
        .populate("companyId", "_id name code")
        .lean();

    return res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error(
      "Add transaction error:",
      error
    );

    if (
      error instanceof Error &&
      error.message.startsWith(
        "Not enough shares to process sell transaction"
      )
    ) {
      return res.status(400).json({
        message: "Not enough shares to complete the sell transaction",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};