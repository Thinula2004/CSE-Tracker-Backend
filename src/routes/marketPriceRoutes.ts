import { Router } from "express";
import { getAllLatestMarketPrices, getLastMarketPriceByCompany, getMarketPricesByCompany, updateCurrentMarketPrices } from "../controllers/marketPriceController";
import { authenticate } from "../services/Authenticator";

const router = Router();

router.post(
  "/update",
  updateCurrentMarketPrices
);

router.get(
  "/latest",
  authenticate,
  getAllLatestMarketPrices
);

router.get(
  "/latest/:companyId",
  authenticate,
  getLastMarketPriceByCompany
);

router.get(
  "/:companyId",
  authenticate,
  getMarketPricesByCompany
);

export default router;