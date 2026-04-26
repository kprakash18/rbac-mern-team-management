import mongoose from "mongoose";

const userTeamRoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true
  }
}, { timestamps: true });

// preventing duplicate assingment
userTeamRoleSchema.index({ user: 1, team: 1 }, { unique: true });

export default mongoose.model("UserTeamRole", userTeamRoleSchema);