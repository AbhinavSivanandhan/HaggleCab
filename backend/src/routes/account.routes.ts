import { Router, RequestHandler } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from "../controllers/account.controller.js";

const router = Router();

// ✅ Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", authMiddleware as unknown as RequestHandler, getUserProfile);

export default router;
