import mongoose from "mongoose";
import UserTeamRole from "../models/userTeamRole.js";
import Team from "../models/teamModel.js";
import Role from "../models/role.js";

// Assign role to user in a team
export const assignRole = async (req, res) => {
  try {
    const { userId, teamId, roleId } = req.body;

    // validation
    if (!userId || !teamId || !roleId) {
      return res.status(400).json({ error: "All fields required" });
    }

    // validate object ids before querying
    const idsAreValid = [userId, teamId, roleId].every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!idsAreValid) {
      return res.status(400).json({ error: "Invalid user/team/role ID format" });
    }

    // check if team and role exist
    const team = await Team.findById(teamId);
    const role = await Role.findById(roleId);

    if (!team || !role) {
      return res.status(404).json({ error: "Invalid team/role" });
    }

    // upsert (update if exists, else create)
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