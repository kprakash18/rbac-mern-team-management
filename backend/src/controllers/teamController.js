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

// get team api
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

