import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  addTransaction,
  getDashboardInformation,
  getTransactions,
  transferMoneyToAccount,
} from "../controller/transactionController.js";

const router = Router();

router.get("/", authMiddleware, getTransactions);
router.get("/dashboard", authMiddleware, getDashboardInformation);
router.post("/add-transaction/:account_id", authMiddleware, addTransaction);
router.put("/transfer-money", authMiddleware, transferMoneyToAccount);

export default router;
