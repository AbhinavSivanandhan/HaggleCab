import { Router, RequestHandler } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createRide,
  placeBid,
  fetchRideBids,
  selectDriver,
  markEnrouteToPassenger,
  markRideInProgress,
  markRideCompleted,
  getRideDetails,
} from "../controllers/ride.controller.js";

const router = Router();

// ✅ Routes
router.post("/", authMiddleware as unknown as RequestHandler, createRide);
router.post("/:rideId/bid", authMiddleware as unknown as RequestHandler, placeBid);
router.get("/:rideId/bids", authMiddleware as unknown as RequestHandler, fetchRideBids);
router.post("/:rideId/select/:driverId", authMiddleware as unknown as RequestHandler, selectDriver);
router.patch("/:rideId/enroute", authMiddleware as unknown as RequestHandler, markEnrouteToPassenger);
router.patch("/:rideId/start", authMiddleware as unknown as RequestHandler, markRideInProgress);
router.patch("/:rideId/complete", authMiddleware as unknown as RequestHandler, markRideCompleted);
router.get("/:rideId", authMiddleware as unknown as RequestHandler, getRideDetails);

export default router;
