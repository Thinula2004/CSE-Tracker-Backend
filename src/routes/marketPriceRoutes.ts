import { Router } from "express";
import { getMarketPricesByCompany, updateCurrentMarketPrices } from "../controllers/marketPriceController";
import { authenticate } from "../services/Authenticator";

const router = Router();

router.post(
  "/update",
  authenticate,
  updateCurrentMarketPrices
);

router.get(
  "/:companyId",
  authenticate,
  getMarketPricesByCompany
);

export default router;