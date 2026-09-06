import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import * as c from "./chat-channel.controller.js";

const chatChannelRouter = Router({ mergeParams: true });
chatChannelRouter.use(authenticate);
chatChannelRouter.get("/", c.getChannelsController);
chatChannelRouter.post("/", c.createChannelController);
chatChannelRouter.post("/:channelId/members", c.addMembersController);
chatChannelRouter.delete("/:channelId", c.deleteChannelController);

export default chatChannelRouter;
