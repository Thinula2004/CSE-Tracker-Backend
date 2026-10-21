import { Router } from "express";
import { getAvgCostByCompany, getShareCountByCompany, getSharesByCompany, getSharesByUser } from "../controllers/shareController";
import { authenticate } from "../services/Authenticator";

const router = Router();

router.get(
  "/count/:companyId",
  authenticate,
  getShareCountByCompany
);

router.get(
  "/avgCost/:companyId",
  authenticate,
  getAvgCostByCompany
);

router.get(
  "/",
  authenticate,
  getSharesByUser
);

router.get(
  "/:companyId",
  authenticate,
  getSharesByCompany
);



export default router;