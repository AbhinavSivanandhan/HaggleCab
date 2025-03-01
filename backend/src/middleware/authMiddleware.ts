import { Request, Response, NextFunction } from "express"; // ✅ Fix
import type { AuthenticatedRequest } from "../types/expressTypes.js"; // ✅ Fix

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.jwt; // ✅ Fix: Ensure `req.cookies` exists
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user as unknown as Document<any, any, IUser> & IUser; // ✅ Fix: Ensure proper type
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
