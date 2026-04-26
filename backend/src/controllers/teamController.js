import Team from "../models/teamModel.js";
// create team api
export const createTeam = async (req, res) =>{
  try {
    const { name } = req.body;

    const team = await Team.create({ name });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Team name required" });
    }

    const team = await Team.findByIdAndUpdate(
      teamId,
      { name },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.json(team);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.json({ message: "Team deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// get team api
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

