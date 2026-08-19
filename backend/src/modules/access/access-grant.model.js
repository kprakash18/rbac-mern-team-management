import mongoose from "mongoose";

const accessGrantSchema = new mongoose.Schema(
  {
    userId: {
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

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      enum: [
        "MANUAL",
        "ACCESS_REQUEST",
        "DELEGATION",
        "SYSTEM",
      ],
      default: "MANUAL",
    },

    accessRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

accessGrantSchema.index({
  userId: 1,
  teamId: 1,
  permissionId: 1,
  resource: 1,
});

const AccessGrant = mongoose.model(
  "AccessGrant",
  accessGrantSchema
);

export default AccessGrant;
