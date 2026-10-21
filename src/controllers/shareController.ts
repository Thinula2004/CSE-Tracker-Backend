import { Response } from "express";
import mongoose from "mongoose";
import Shares from "../models/Share";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

export const getShareCountByCompany = async (
  req: AuthenticatedRequest & {
    params: { companyId: string };
  },
  res: Response
) => {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    const shares = await Shares.findOne({
      userId,
      companyId,
    }).select("amount");

    if (!shares) {
      return res.status(200).json(0);
    }

    return res.status(200).json(shares.amount);
  } catch (error) {
    console.error(
      "Get share count by company error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getSharesByUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const shares = await Shares.find({
      userId,
    })
      .populate("companyId", "_id name code")
      .sort({ createdAt: 1 });

    return res.status(200).json(shares);
  } catch (error) {
    console.error(
      "Get shares by user error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getSharesByCompany = async (
  req: AuthenticatedRequest & {
    params: { companyId: string };
  },
  res: Response
) => {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    const shares = await Shares.findOne({
      userId,
      companyId,
    });

    if (!shares) {
      return res.status(200).json([]);
    }

    return res.status(200).json([shares]);
  } catch (error) {
    console.error(
      "Get shares by company error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAvgCostByCompany = async (
  req: AuthenticatedRequest & {
    params: { companyId: string };
  },
  res: Response
) => {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    const shares = await Shares.findOne({
      userId,
      companyId,
    }).select("avgCost");

    if (!shares) {
      return res.status(200).json(null);
    }

    return res.status(200).json(shares.avgCost);
  } catch (error) {
    console.error(
      "Get average cost by company error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};