import mongoose, { Schema, Document } from "mongoose";

export interface IDriverBid {
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  driverRating: number;
  bidPrice: number;
}

export interface IRide extends Document {
  passengerId: mongoose.Types.ObjectId;
  source: { lat: number; long: number };
  destination: { lat: number; long: number };
  sourceName: string;
  destinationName: string;
  passengerBid: number;
  driverBids: IDriverBid[];
  statusOfRideCompletion:
    | "hailed"
    | "enrouteToPassenger"
    | "inProgress"
    | "completed"
    | "rejectedByPassenger"
    | "expired";
  hailTime: Date;
  expiryTime: Date;
  assignedDriver?: {
    driverId: mongoose.Types.ObjectId;
    driverName: string;
    bidPrice: number;
  };
}

// ✅ Ride Schema
const RideSchema = new Schema<IRide>({
  passengerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  source: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
  },
  destination: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
  },
  sourceName: { type: String, required: true },
  destinationName: { type: String, required: true },
  passengerBid: { type: Number, required: true },
  driverBids: [
    {
      driverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      driverName: { type: String, required: true },
      driverRating: { type: Number, required: true },
      bidPrice: { type: Number, required: true },
    },
  ],
  statusOfRideCompletion: {
    type: String,
    enum: [
      "hailed",
      "enrouteToPassenger",
      "inProgress",
      "completed",
      "rejectedByPassenger",
      "expired",
    ],
    default: "hailed",
  },
  hailTime: { type: Date, default: Date.now },
  expiryTime: { type: Date, required: true }, // Auto set to hailTime + 3 min
  assignedDriver: {
    driverId: { type: Schema.Types.ObjectId, ref: "User" },
    driverName: { type: String },
    bidPrice: { type: Number },
  },
});

// ✅ Auto-expire rides after 3 minutes
RideSchema.pre("save", function (next) {
  if (!this.expiryTime) {
    this.expiryTime = new Date(this.hailTime.getTime() + 3 * 60 * 1000);
  }
  next();
});

const Ride = mongoose.model<IRide>("Ride", RideSchema);
export default Ride;
