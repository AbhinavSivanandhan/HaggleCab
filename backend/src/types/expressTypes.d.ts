import { Request } from "express";
import { Document } from "mongoose";
import { IUser } from "../models/user.model.js"; // ✅ Fix: Ensure correct import

export interface AuthenticatedRequest extends Request {
  user?: (Document<any, any, IUser> & IUser); // ✅ Fix: Matches Mongoose Document type
  cookies: { [key: string]: string };
}
