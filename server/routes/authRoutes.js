import { Router } from "express";
import { signinUser, signupUser } from "../controller/authControllers.js";


const router = Router();

router.post("/sign-up", signupUser);
router.post("/sign-in", signinUser)

export default router;