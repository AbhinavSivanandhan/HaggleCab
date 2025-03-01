import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Corrected `asyncHandler` to properly handle async functions
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// ✅ Register User (Passenger or Driver)
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role, phoneNumber } = req.body;

    if (!name || !email || !password || !role || !phoneNumber) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    user = new User({ name, email, password, role, phoneNumber });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  })
);

// ✅ Login User (Set Secure HTTP-only Cookie)
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: "15m",
    });

    // Store JWT in HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  })
);

// ✅ Logout (Clear Cookie)
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("jwt", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
});

// ✅ Get User Profile (Protected)
router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => { // ✅ Fix: Ensure req is `AuthenticatedRequest`
    res.json(req.user);
  })
);

export default router;
