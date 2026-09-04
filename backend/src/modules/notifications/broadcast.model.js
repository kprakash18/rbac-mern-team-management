import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["OUTAGE", "MAINTENANCE", "POLICY", "ANNOUNCEMENT"],
      default: "ANNOUNCEMENT",
    },
    severity: {
      type: String,
      enum: ["CRITICAL", "WARNING", "INFO"],
      default: "INFO",
    },
    isSticky: {
      type: Boolean,
      default: false,
    },
    requiresAck: {
      type: Boolean,
      default: false,
    },
    startsAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ENDED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

broadcastSchema.index({ status: 1, startsAt: 1, expiresAt: 1 });
broadcastSchema.index({ teamId: 1, status: 1, startsAt: 1, expiresAt: 1 });

const Broadcast = mongoose.model("Broadcast", broadcastSchema);
export default Broadcast;
