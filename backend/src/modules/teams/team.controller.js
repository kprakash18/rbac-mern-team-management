import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendCreated, sendSuccess } from "../../common/http/response.js";
import { teamService } from "./team.service.js";

export const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam({
    name: req.body.name,
    description: req.body.description,
    createdBy: req.user.id,
  });
  sendCreated(res, { data: team });
});

export const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await teamService.getUserTeams(req.user.id);
  sendSuccess(res, { data: teams });
});

export const getTeams = asyncHandler(async (req, res) => {
  const result = await teamService.listTeams(req.query);
  sendSuccess(res, { data: result.teams, pagination: result });
});

export const getTeamById = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.teamId);
  sendSuccess(res, { data: team });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const updated = await teamService.updateTeam(req.params.teamId, req.body);
  sendSuccess(res, { data: updated });
});

export const archiveTeam = asyncHandler(async (req, res) => {
  const result = await teamService.archiveTeam(req.params.teamId);
  sendSuccess(res, { message: result.message, data: result.data });
});

export const getWorkspaceBootstrap = asyncHandler(async (req, res) => {
  const bootstrapData = await teamService.getWorkspaceBootstrap({
    teamId: req.params.teamId,
    userId: req.user.id,
    actor: req.user,
  });
  sendSuccess(res, { data: bootstrapData });
});

export const teamController = {
  createTeam,
  getMyTeams,
  getTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
  getWorkspaceBootstrap,
};

export default teamController;
