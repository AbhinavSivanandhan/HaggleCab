import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import type { AuthenticatedRequest } from "../types/expressTypes.js";

// ✅ Async handler to handle errors cleanly
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// ✅ Register User
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
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
});

// ✅ Login User (Set Secure HTTP-only Cookie)
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
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
});

// ✅ Logout User (Clear Cookie)
export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("jwt", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
};

// ✅ Get User Profile
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest; // ✅ Ensure it's `AuthenticatedRequest`
  res.json(authReq.user);
});
