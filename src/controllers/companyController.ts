import { Request, Response } from "express";
import mongoose from "mongoose";
import Company from "../models/Company";

export const initializeCompanies = async (
  req: Request,
  res: Response
) => {
  try {
    const response = await fetch(
      "https://www.cse.lk/api/allSecurityCode",
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch companies from CSE",
      });
    }

    const companies = await response.json();

    if (!Array.isArray(companies)) {
      return res.status(502).json({
        success: false,
        message: "Invalid response received from CSE",
      });
    }

    const validCompanies = companies
      .filter(
        (company) =>
          company.name &&
          company.symbol
      )
      .map((company) => ({
        name: company.name.trim(),
        code: company.symbol.trim().toUpperCase(),
      }));

    if (validCompanies.length === 0) {
      return res.status(502).json({
        success: false,
        message: "No valid companies received from CSE",
      });
    }

    const operations = validCompanies.map((company) => ({
      updateOne: {
        filter: {
          code: company.code,
        },
        update: {
          $set: {
            name: company.name,
          },
        },
        upsert: true,
      },
    }));

    const result = await Company.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      message: "Companies initialized successfully",
      total: validCompanies.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Initialize companies error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCompanies = async (
  req: Request,
  res: Response
) => {
  try {
    const { page, limit, search } = req.query;

    // Pagination is required
    if (page === undefined || limit === undefined) {
      return res.status(400).json({
        success: false,
        message: "Page and limit are required",
      });
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Validate pagination values
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    // Search must be a string if provided
    if (search !== undefined && typeof search !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search must be a string",
      });
    }

    const filter: any = {};

    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
      ];
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNumber)
        .select("_id name code"),

      Company.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      companies,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get companies error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCompanyById = async (
  req: Request<{ companyId: string }>,
  res: Response
) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(companyId).select(
      "_id name code"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      company,
    });
  } catch (error) {
    console.error("Get company by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};