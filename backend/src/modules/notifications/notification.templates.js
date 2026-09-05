/**
 * Centralized Notification Templates & Formatters
 * Ensures consistent, professional phrasing for all business domain events.
 */

export const NotificationTemplates = {
  // Required Canonical Templates
  TASK_ASSIGNED: ({ taskTitle, actorName }) => ({
    title: "Task Assigned",
    message: actorName
      ? `Task "${taskTitle}" was assigned to you by ${actorName}.`
      : `Task "${taskTitle}" was assigned to you.`,
  }),
  TASK_STATUS_CHANGED: ({ taskTitle, status, actorName }) => ({
    title: "Task Status Changed",
    message: actorName
      ? `Task "${taskTitle}" status was changed to ${status} by ${actorName}.`
      : `Task "${taskTitle}" status was changed to ${status}.`,
  }),
  USER_ROLE_CHANGED: ({ roleName, details }) => ({
    title: "Role Changed",
    message: roleName
      ? `Your role has been changed to ${roleName}.`
      : (details || "Your role assignment has been updated."),
  }),
  USER_STATUS_CHANGED: ({ status, teamName, details }) => ({
    title: "Account Status Changed",
    message: status && teamName
      ? `Your membership in ${teamName} is now ${status.toLowerCase()}.`
      : (details || "Your account or membership status has been updated."),
  }),
  USER_ACCESS_CHANGED: ({ permissionName, resource, details }) => ({
    title: "Access Permissions Changed",
    message: permissionName
      ? `Your access for '${permissionName}' on ${resource || "resource"} has changed.`
      : (details || "Your permissions or access grants have been modified."),
  }),
  GROUP_MEMBER_ADDED: ({ groupName, teamName }) => ({
    title: "Added to Team",
    message: `You have been added to the ${teamName || groupName || "team"}.`,
  }),

  // Legacy / Domain-specific Aliases
  ROLE_ASSIGNED: ({ roleName }) => ({
    title: "New Role Assigned",
    message: `You were assigned the role '${roleName}'.`,
  }),
  ROLE_REVOKED: ({ roleName }) => ({
    title: "Role Revoked",
    message: roleName
      ? `Your '${roleName}' role has been revoked.`
      : "One of your assigned roles has been revoked.",
  }),
  PERMISSION_CHANGED: ({ roleName, details }) => ({
    title: "Role Permissions Updated",
    message: details || `Permissions for role '${roleName}' have been updated.`,
  }),

  // 2. Team Membership Events
  TEAM_ADDED: ({ teamName }) => ({
    title: "Added to Team",
    message: `You were added to team ${teamName}.`,
  }),
  TEAM_SUSPENDED: ({ teamName }) => ({
    title: "Membership Suspended",
    message: `Your team membership in ${teamName} has been suspended.`,
  }),
  TEAM_REACTIVATED: ({ teamName }) => ({
    title: "Membership Reactivated",
    message: `Your team membership in ${teamName} has been reactivated.`,
  }),
  TEAM_REMOVED: ({ teamName }) => ({
    title: "Removed from Team",
    message: `You were removed from team ${teamName}.`,
  }),

  // 3. Task Events
  TASK_ASSIGNED: ({ taskTitle, actorName }) => ({
    title: "New Task Assigned",
    message: actorName
      ? `${actorName} assigned you to task: ${taskTitle}.`
      : `You were assigned task: ${taskTitle}.`,
  }),
  TASK_UNASSIGNED: ({ taskTitle }) => ({
    title: "Removed from Task",
    message: `You were unassigned from task: ${taskTitle}.`,
  }),
  TASK_STATUS_CHANGED: ({ taskTitle, status, actorName }) => ({
    title: "Task Status Updated",
    message: `Task '${taskTitle}' status was changed to ${status}${actorName ? ` by ${actorName}` : ""}.`,
  }),
  TASK_COMPLETED: ({ taskTitle, actorName }) => ({
    title: "Task Completed",
    message: `Task '${taskTitle}' was marked as completed${actorName ? ` by ${actorName}` : ""}.`,
  }),
  TASK_DUE_DATE_CHANGED: ({ taskTitle, dueDate }) => ({
    title: "Task Due Date Updated",
    message: `Due date for '${taskTitle}' was updated to ${dueDate}.`,
  }),
  TASK_REMARKS_UPDATED: ({ taskTitle, actorName, preview }) => ({
    title: "Progress Note Updated",
    message: actorName
      ? `${actorName} updated the progress note on task '${taskTitle}'${preview ? `: "${preview}"` : "."}`
      : `The progress note on task '${taskTitle}' was updated${preview ? `: "${preview}"` : "."}`,
  }),


  // 4. Chat & Channel Events
  CHANNEL_ADDED: ({ channelName, actorName }) => ({
    title: "Added to Channel",
    message: actorName
      ? `You were added to channel #${channelName} by ${actorName}.`
      : `You were added to channel #${channelName}.`,
  }),

  // 5. Invitation Events
  INVITATION_RECEIVED: ({ teamName, inviterName }) => ({
    title: "New Team Invitation",
    message: inviterName
      ? `${inviterName} invited you to join team ${teamName}.`
      : `You have been invited to join team ${teamName}.`,
  }),
  INVITATION_ACCEPTED: ({ teamName, userName }) => ({
    title: "Invitation Accepted",
    message: `${userName} accepted your invitation to join ${teamName}.`,
  }),

  // 6. Access & JIT Request Events
  ACCESS_REQUEST_SUBMITTED: ({ requesterName, permissionKey }) => ({
    title: "New Access Request",
    message: `${requesterName} requested temporary access for '${permissionKey}'.`,
  }),
  ACCESS_GRANTED: ({ permissionKey }) => ({
    title: "Access Request Approved",
    message: permissionKey
      ? `Your access request for '${permissionKey}' has been approved.`
      : "Your access request has been approved.",
  }),
  ACCESS_REJECTED: ({ permissionKey, reason }) => ({
    title: "Access Request Rejected",
    message: `Your access request${permissionKey ? ` for '${permissionKey}'` : ""} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  }),
  ACCESS_REVOKED: ({ permissionKey }) => ({
    title: "Access Revoked",
    message: permissionKey
      ? `Your access grant for '${permissionKey}' has been revoked.`
      : "Your temporary access grant has been revoked.",
  }),

  // 7. System & Fallback
  SYSTEM: ({ title, message }) => ({
    title: title || "System Notification",
    message: message || "You have a new system update.",
  }),
};
