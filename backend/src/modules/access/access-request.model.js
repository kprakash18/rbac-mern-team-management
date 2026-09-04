import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    resource: {
      type: String,
      required: true,
      trim: true,
    },

    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "EXPIRED",
        "REVOKED",
      ],
      default: "PENDING",
      index: true,
    },

    approvalLevel: {
      type: String,
      enum: ["TEAM_ADMIN", "SUPER_ADMIN"],
      default: "TEAM_ADMIN",
    },

    durationHours: {
      type: Number,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

accessRequestSchema.index({
  targetUserId: 1,
  teamId: 1,
  status: 1,
});

const AccessRequest = mongoose.model(
  "AccessRequest",
  accessRequestSchema
);

export default AccessRequest;
