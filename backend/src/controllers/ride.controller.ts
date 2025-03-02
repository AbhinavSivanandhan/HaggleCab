import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Ride from "../models/ride.model.js";
import type { AuthenticatedRequest } from "../types/expressTypes.js";
import { io } from "../index.js"; // ✅ Import WebSocket instance

// ✅ Async handler to manage errors cleanly
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// ✅ Passenger creates a ride
export const createRide = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || authReq.user.role !== "passenger") {
    res.status(403).json({ message: "Only passengers can request rides" });
    return;
  }

  const { source, destination, sourceName, destinationName, passengerBid } = req.body;

  if (!source || !destination || !sourceName || !destinationName || !passengerBid) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const ride = new Ride({
    passengerId: authReq.user._id,
    source,
    destination,
    sourceName,
    destinationName,
    passengerBid,
    driverBids: [],
  });

  await ride.save();
  res.status(201).json({ message: "Ride created successfully", ride });
});

// ✅ Driver places a bid (Emit WebSocket event)
export const placeBid = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== "driver") {
    res.status(403).json({ message: "Only drivers can place bids" });
    return;
  }

  const { rideId } = req.params;
  const { bidPrice } = req.body;

  if (!bidPrice) {
    res.status(400).json({ message: "Bid price is required" });
    return;
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  if (new Date() > new Date(ride.expiryTime)) {
    res.status(400).json({ message: "Ride bidding has expired" });
    return;
  }

  const bid = {
    driverId: authReq.user._id,
    driverName: authReq.user.name,
    driverRating: (authReq.user as any).rating || 5.0,
    bidPrice,
  };

  ride.driverBids.push(bid);
  await ride.save();

  // ✅ Emit WebSocket event to notify the passenger
  io.to(rideId).emit("newBid", bid);

  res.status(201).json({ message: "Bid placed successfully", ride });
});

// ✅ Passenger fetches ride bids
export const fetchRideBids = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { rideId } = req.params;

  const ride = await Ride.findById(rideId);
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  if (!authReq.user || !ride.passengerId.equals(authReq.user._id)) {
    res.status(403).json({ message: "You are not authorized to view this ride's bids" });
    return;
  }

  res.json(ride.driverBids);
});

// ✅ Passenger selects a driver (Hard deletes all other bids)
export const selectDriver = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { rideId, driverId } = req.params;
  
    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }
  
    if (!authReq.user || !ride.passengerId.equals(authReq.user._id)) {
      res.status(403).json({ message: "You are not authorized to select a driver for this ride" });
      return;
    }
  
    const selectedBid = ride.driverBids.find((bid: any) => bid.driverId.equals(new mongoose.Types.ObjectId(driverId)));
    if (!selectedBid) {
      res.status(400).json({ message: "Invalid driver selection" });
      return;
    }
  
    ride.assignedDriver = {
      driverId: selectedBid.driverId,
      driverName: selectedBid.driverName,
      bidPrice: selectedBid.bidPrice,
    };
  
    ride.statusOfRideCompletion = "enrouteToPassenger";
    ride.driverBids = []; // ✅ Hard delete all bids
  
    await ride.save();
  
    // ✅ Emit WebSocket event to notify the driver
    io.to(rideId).emit("driverSelected", {
      driverId: selectedBid.driverId,
      driverName: selectedBid.driverName,
      bidPrice: selectedBid.bidPrice,
    });
  
    res.json({ message: "Driver selected successfully", ride });
  });
  
  // ✅ Driver marks ride as "Enroute to Passenger"
  export const markEnrouteToPassenger = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { rideId } = req.params;
  
    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }
  
    if (!authReq.user || ride.assignedDriver?.driverId.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: "Only the assigned driver can update this ride" });
      return;
    }
  
    ride.statusOfRideCompletion = "enrouteToPassenger";
    await ride.save();
  
    // ✅ Notify passenger via WebSocket
    io.to(rideId).emit("rideStatusUpdate", { status: "enrouteToPassenger" });
  
    res.json({ message: "Ride status updated: Enroute to Passenger", ride });
  });
  
  // ✅ Driver marks ride as "In Progress"
  export const markRideInProgress = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { rideId } = req.params;
  
    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }
  
    if (!authReq.user || ride.assignedDriver?.driverId.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: "Only the assigned driver can update this ride" });
      return;
    }
  
    ride.statusOfRideCompletion = "inProgress";
    await ride.save();
  
    // ✅ Notify passenger via WebSocket
    io.to(rideId).emit("rideStatusUpdate", { status: "inProgress" });
  
    res.json({ message: "Ride started", ride });
  });
  
  // ✅ Driver marks ride as "Completed"
  export const markRideCompleted = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { rideId } = req.params;
  
    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }
  
    if (!authReq.user || ride.assignedDriver?.driverId.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: "Only the assigned driver can complete this ride" });
      return;
    }
  
    ride.statusOfRideCompletion = "completed";
    await ride.save();
  
    // ✅ Notify passenger via WebSocket
    io.to(rideId).emit("rideStatusUpdate", { status: "completed" });
  
    res.json({ message: "Ride completed successfully", ride });
  });
  
  // ✅ Get ride details
  export const getRideDetails = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
  
    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }
  
    if (authReq.user && (ride.passengerId.equals(authReq.user._id) || ride.assignedDriver?.driverId.equals(authReq.user._id))) {
      res.json(ride);
      return;
    }
  
    res.status(403).json({ message: "You are not authorized to view this ride" });
  });
  