import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

interface JwtPayload {
  id: string;
  tokenVersion: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "User account is inactive",
      });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        message: "Token is no longer valid",
      });
    }

    req.user = {
      id: user._id.toString(),
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};