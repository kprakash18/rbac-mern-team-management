import {
  optionalArray,
  optionalObjectId,
  optionalString,
  requiredArray,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

export const teamChannelParamSchema = {
  params: {
    teamId: requiredObjectId(),
  },
};

export const createChannelSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    name: requiredString({ max: 80 }),
    topic: optionalString({ max: 250 }),
    memberIds: optionalArray({ itemValidator: optionalObjectId(), max: 500 }),
  },
};

export const channelIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
    channelId: requiredObjectId(),
  },
};

export const addChannelMembersSchema = {
  params: {
    teamId: requiredObjectId(),
    channelId: requiredObjectId(),
  },
  body: {
    memberIds: requiredArray({ itemValidator: optionalObjectId(), min: 1, max: 500 }),
  },
};
