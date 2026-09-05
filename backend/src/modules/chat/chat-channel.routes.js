import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  getChannelsController,
  createChannelController,
  addMembersController,
  deleteChannelController,
} from "./chat-channel.controller.js";

const chatChannelRouter = Router({ mergeParams: true });

// All routes require authentication
chatChannelRouter.use(authenticate);

// GET /api/teams/:teamId/channels
chatChannelRouter.get("/", getChannelsController);

// POST /api/teams/:teamId/channels
chatChannelRouter.post("/", createChannelController);

// POST /api/teams/:teamId/channels/:channelId/members
chatChannelRouter.post("/:channelId/members", addMembersController);

// DELETE /api/teams/:teamId/channels/:channelId
chatChannelRouter.delete("/:channelId", deleteChannelController);

export default chatChannelRouter;
