import { Router } from "express";

import {
  addTransaction,
} from "../controllers/transactionController";

import { authenticate } from "../services/Authenticator";

const router = Router();

router.post(
  "/",
  authenticate,
  addTransaction
);

export default router;