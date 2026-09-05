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
      default: "INFO",
    },
    scope: {
      type: String,
      enum: ["GLOBAL", "WORKSPACE_SCOPED", "ROLE_SCOPED"],
      default: "GLOBAL",
    },
    targetWorkspaces: {
      type: [String],
      default: [],
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    ackMode: {
      type: String,
      enum: ["NONE", "READ_RECEIPT", "MANDATORY_ACK"],
      default: "READ_RECEIPT",
    },
    cta: {
      label: { type: String, default: null },
      url: { type: String, default: null },
    },
    metrics: {
      targetedUsers: { type: Number, default: 0 },
      viewedCount: { type: Number, default: 0 },
      acknowledgedCount: { type: Number, default: 0 },
    },
    workspaceBreakdown: {
      type: Array,
      default: [],
    },
    roleBreakdown: {
      type: Array,
      default: [],
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
      enum: ["ACTIVE", "SCHEDULED", "ENDED"],
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
