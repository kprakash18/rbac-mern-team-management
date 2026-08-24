import mongoose from "mongoose";

const membershipRoleSchema = new mongoose.Schema(
  {
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
    revokedAt : {
      type: Date,
      default : null
    },
    revokedBy : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default : null,
    }
  },
  {
    timestamps: true,
  }
);

membershipRoleSchema.index(
  { membershipId: 1, roleId: 1 },
  { unique: true , partialFilterExpression: {revokedAt: null} }
);

const MembershipRole = mongoose.model(
  "MembershipRole",
  membershipRoleSchema
);

export default MembershipRole;
