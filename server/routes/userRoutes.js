import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  changePassword,
  getUser,
  updateUser,
} from "../controller/userController.js";

const router = Router();

router.get("/", authMiddleware, getUser);
router.put("/change-password", authMiddleware, changePassword);
router.put("/", authMiddleware, updateUser);

export default router;
