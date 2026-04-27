import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  addMoneyToAccount,
  createAccount,
  getAccounts,
} from "../controller/accountController.js";

const router = Router();

router.get("/:id", authMiddleware, getAccounts);
router.post("/create", authMiddleware, createAccount);
router.put("/add-money/:id", authMiddleware, addMoneyToAccount);
export default router;
