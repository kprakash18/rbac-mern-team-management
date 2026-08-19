import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "REMOVED"],
      default: "ACTIVE",
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index(
  { userId: 1, teamId: 1 },
  { unique: true }
);

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
