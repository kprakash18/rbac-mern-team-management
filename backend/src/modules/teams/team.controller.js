import { teamService } from "./team.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const team = await teamService.createTeam({
    name,
    description,
    createdBy: req.user.id,
  });
  res.status(201).json({ success: true, data: team });
});

export const getTeams = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const result = await teamService.listTeams({ status, search, page, limit });
  res.status(200).json({ success: true, data: result.teams, pagination: result });
});

export const getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await teamService.getTeamById(teamId);
  res.status(200).json({ success: true, data: team });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;
  const updated = await teamService.updateTeam(teamId, { name, description });
  res.status(200).json({ success: true, data: updated });
});

export const archiveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const result = await teamService.archiveTeam(teamId);
  res.status(200).json(result);
});

export const teamController = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
};

export default teamController;
