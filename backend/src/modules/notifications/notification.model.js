import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "USER_ROLE_CHANGED",
  "USER_STATUS_CHANGED",
  "USER_ACCESS_CHANGED",
  "GROUP_MEMBER_ADDED",
  // Legacy / Domain-specific aliases
  "ROLE_ASSIGNED",
  "ROLE_REVOKED",
  "PERMISSION_CHANGED",
  "TEAM_MEMBERSHIP",
  "CHANNEL_ADDED",
  "TASK_UNASSIGNED",
  "TASK_COMPLETED",
  "TASK_DUE_DATE_CHANGED",
  "INVITATION_RECEIVED",
  "INVITATION_ACCEPTED",
  "ACCESS_REQUEST",
  "ACCESS_GRANTED",
  "ACCESS_REVOKED",
  "SYSTEM",
];

export const RESOURCE_TYPES = [
  "TASK",
  "ROLE",
  "MEMBERSHIP",
  "ACCESS_REQUEST",
  "ACCESS_GRANT",
  "CHANNEL",
  "INVITATION",
  "USER",
  "TEAM",
  "GROUP",
  "SYSTEM",
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },

    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      default: "SYSTEM",
    },

    resourceId: {
      type: String,
      default: null,
    },

    resource: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    readAt: {
      type: Date,
      default: null,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound queries for unread badges and user pagination
notificationSchema.index({
  recipientId: 1,
  readAt: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipientId: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
