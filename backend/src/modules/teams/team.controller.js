import { teamService } from "./team.service.js";

export async function createTeam(req, res, next) {
  try {
    const { name, description } = req.body;
    const team = await teamService.createTeam({
      name,
      description,
      createdBy: req.user.id,
    });
    return res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function getMyTeams(req, res, next) {
  try {
    const teams = await teamService.getUserTeams(req.user.id);
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
}

export async function getTeams(req, res, next) {

  try {
    const { status, search, page, limit } = req.query;
    const result = await teamService.listTeams({ status, search, page, limit });
    return res.status(200).json({ success: true, data: result.teams, pagination: result });
  } catch (error) {
    next(error);
  }
}

export async function getTeamById(req, res, next) {
  try {
    const { teamId } = req.params;
    const team = await teamService.getTeamById(teamId);
    return res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    const { name, description, status } = req.body;
    const updated = await teamService.updateTeam(teamId, { name, description, status });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function archiveTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    const result = await teamService.archiveTeam(teamId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const teamController = {
  createTeam,
  getMyTeams,
  getTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
};

export default teamController;

