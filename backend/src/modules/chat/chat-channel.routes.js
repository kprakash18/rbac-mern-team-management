import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireActiveTeamMember } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import * as c from "./chat-channel.controller.js";
import {
  addChannelMembersSchema,
  channelIdParamSchema,
  createChannelSchema,
  teamChannelParamSchema,
} from "./chat-channel.validation.js";

const chatChannelRouter = Router({ mergeParams: true });
chatChannelRouter.use(authenticate, requireActiveTeamMember());
chatChannelRouter.get("/", validateRequest(teamChannelParamSchema), c.getChannelsController);
chatChannelRouter.post("/", validateRequest(createChannelSchema), c.createChannelController);
chatChannelRouter.post("/:channelId/members", validateRequest(addChannelMembersSchema), c.addMembersController);
chatChannelRouter.delete("/:channelId", validateRequest(channelIdParamSchema), c.deleteChannelController);

export default chatChannelRouter;
