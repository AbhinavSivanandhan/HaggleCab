import mongoose from "mongoose";
import Ride from "../models/ride.model.js";
import Bull from "bull";
import dotenv from "dotenv";

dotenv.config();

// ✅ Setup Redis Queue
const rideQueue = new Bull("rideCleanupQueue", {
  redis: { host: "127.0.0.1", port: 6379 },
});

// ✅ Worker to check expired rides every minute
rideQueue.process(async () => {
  console.log("🔄 Checking for expired rides...");

  const expiredRides = await Ride.find({
    statusOfRideCompletion: "hailed",
    expiryTime: { $lte: new Date() },
  });

  for (const ride of expiredRides) {
    if (ride.driverBids.length > 0) {
      // ✅ Auto-assign the lowest bid
      const lowestBid = ride.driverBids.reduce((minBid, bid) =>
        bid.bidPrice < minBid.bidPrice ? bid : minBid
      );

      ride.assignedDriver = {
        driverId: lowestBid.driverId,
        driverName: lowestBid.driverName,
        bidPrice: lowestBid.bidPrice,
      };

      ride.statusOfRideCompletion = "enrouteToPassenger";
      ride.driverBids = []; // Remove all other bids
    } else {
      // ❌ No bids, mark as expired
      ride.statusOfRideCompletion = "expired";
    }

    await ride.save();
  }

  console.log(`✅ Processed ${expiredRides.length} expired rides.`);
});

// ✅ Start worker job
const startWorker = async () => {
  console.log("🚀 Ride Cleanup Worker Running...");
  rideQueue.add({}, { repeat: { every: 60 * 1000 } }); // Run every 1 min
};

startWorker();
