import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import csurf from "csurf"; // Ensure 'npm install -D @types/csurf' is installed
import accountRoutes from "./routes/account.routes.ts";
import rideRoutes from "./routes/ride.routes.ts";

dotenv.config();

// ✅ Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ridesharing";

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit on failure
  });

// ✅ Middleware
console.log("✅ Initializing Middleware...");
app.use(cors({ origin: "http://your-frontend.com", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ CSRF Protection
app.use(csurf({ cookie: true }));

// ✅ Register Routes
console.log("✅ Registering Routes...");
app.use("/api/account", accountRoutes); // Account-related endpoints (register, login, logout, profile)
app.use("/api/rides", rideRoutes); // Ride-related endpoints

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("API is running!");
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
