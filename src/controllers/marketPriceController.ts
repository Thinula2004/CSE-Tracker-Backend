import { Request, Response } from "express";
import mongoose from "mongoose";
import Company from "../models/Company";
import MarketPrice from "../models/MarketPrice";

export const updateCurrentMarketPrices = async (
  req: Request,
  res: Response
) => {
  try {
    const companies = await Company.find().select("_id name code");

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No companies found",
      });
    }

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    let updatedCount = 0;
    let insertedCount = 0;
    let failedCount = 0;

    for (const company of companies) {
      try {
        const formData = new FormData();
        formData.append("symbol", company.code);

        const response = await fetch(
          "https://www.cse.lk/api/companyInfoSummery",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          console.log(`❌ Failed for ${company.code}`);
          failedCount++;
          continue;
        }

        const data = await response.json();

        const symbolInfo = data?.reqSymbolInfo;

        if (!symbolInfo) {
          console.log(`❌ No symbol info for ${company.code}`);
          failedCount++;
          continue;
        }

        const price =
          symbolInfo.lastTradedPrice ?? symbolInfo.previousClose;

        if (!price || price <= 0) {
          console.log(`❌ Invalid price for ${company.code}`);
          failedCount++;
          continue;
        }

        const existing = await MarketPrice.findOne({
          companyId: company._id,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        if (existing) {
          existing.price = price;
          existing.date = now;

          await existing.save();

          updatedCount++;

          console.log(
            `🔄 Updated ${company.code}: ${price}`
          );
        } else {
          await MarketPrice.create({
            companyId: company._id,
            price,
            date: now,
          });

          insertedCount++;

          console.log(
            `✅ Inserted ${company.code}: ${price}`
          );
        }
      } catch (error) {
        console.log(
          `❌ Error updating ${company.code}`,
          error
        );

        failedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Market prices updated successfully",
      totalCompanies: companies.length,
      inserted: insertedCount,
      updated: updatedCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error(
      "Update market prices error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMarketPricesByCompany = async (
  req: Request<{ companyId: string }>,
  res: Response
) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
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

    const marketPrices = await MarketPrice.find({
      companyId,
    })
      .sort({ date: 1 })
      .select("_id companyId price date");

    return res.status(200).json(marketPrices);
  } catch (error) {
    console.error(
      "Get market prices by company error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};