import mongoose from "mongoose";
import UserTeamRole from "../models/userTeamRole.js";
import User from "../models/userModel.js";
import Team from "../models/teamModel.js";
import Role from "../models/role.js";

const validateIds = (ids) => ids.every((id) => mongoose.Types.ObjectId.isValid(id));

export const addUserToTeam = async (req, res) => {
  try {
    const { userId, teamId, roleId = null } = req.body;

    if (!userId || !teamId) {
      return res.status(400).json({ error: "userId and teamId required" });
    }

    const idsAreValid = validateIds([userId, teamId, ...(roleId ? [roleId] : [])]);
    if (!idsAreValid) {
      return res.status(400).json({ error: "Invalid user/team/role ID format" });
    }

    const user = await User.findById(userId);
    const team = await Team.findById(teamId);
    const role = roleId ? await Role.findById(roleId) : null;

    if (!user || !team || (roleId && !role)) {
      return res.status(404).json({ error: "Invalid user/team/role" });
    }

    const mapping = await UserTeamRole.findOneAndUpdate(
      { user: userId, team: teamId },
      { role: roleId },
      { new: true, upsert: true }
    );

    res.status(200).json(mapping);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoleAssignment = async (req, res) => {
  try {
    const { userId, teamId, roleId } = req.body;

    if (!userId || !teamId || !roleId) {
      return res.status(400).json({ error: "userId, teamId and roleId required" });
    }

    if (!validateIds([userId, teamId, roleId])) {
      return res.status(400).json({ error: "Invalid user/team/role ID format" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Invalid role" });
    }

    const mapping = await UserTeamRole.findOneAndUpdate(
      { user: userId, team: teamId },
      { role: roleId },
      { new: true, upsert: true }
    );

    return res.json(mapping);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const removeUserFromTeam = async (req, res) => {
  try {
    const { userId, teamId } = req.body;

    if (!userId || !teamId) {
      return res.status(400).json({ error: "userId and teamId required" });
    }

    if (!validateIds([userId, teamId])) {
      return res.status(400).json({ error: "Invalid user/team ID format" });
    }

    const removed = await UserTeamRole.findOneAndDelete({ user: userId, team: teamId });
    if (!removed) {
      return res.status(404).json({ error: "Membership not found" });
    }

    return res.json({ message: "User removed from team" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//get all mappings 
export const getMappings = async (req, res) => {
  try {
    const data = await UserTeamRole.find()
      .populate("user")
      .populate("team")
      .populate("role");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};