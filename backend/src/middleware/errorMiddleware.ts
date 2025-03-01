import { Request, Response, NextFunction } from "express"; // ✅ Fix

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({ 
    message: err.message || "An unexpected error occurred" 
  });
};

export default errorMiddleware;
