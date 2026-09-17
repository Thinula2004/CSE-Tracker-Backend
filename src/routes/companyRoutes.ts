import { Router } from "express";
import { getCompanies, getCompanyById, initializeCompanies } from "../controllers/companyController";
import { authenticate } from "../services/Authenticator";

const router = Router();

router.post("/initialize", authenticate, initializeCompanies);
router.get("/", authenticate, getCompanies);
router.get("/:companyId", authenticate, getCompanyById);

export default router;