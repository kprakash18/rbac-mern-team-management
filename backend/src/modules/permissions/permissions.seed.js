export const permissionSeedData = [
  // ============================================================
  // USER
  // ============================================================

  {
    key: "user.read",
    resource: "user",
    action: "read",
    category: "USER_MANAGEMENT",
    description: "View users",
    isSystemPermission: true
  },
  {
    key: "user.create",
    resource: "user",
    action: "create",
    category: "USER_MANAGEMENT",
    description: "Create users",
    isSystemPermission: true
  },
  {
    key: "user.update",
    resource: "user",
    action: "update",
    category: "USER_MANAGEMENT",
    description: "Update user information",
    isSystemPermission: true
  },
  {
    key: "user.delete",
    resource: "user",
    action: "delete",
    category: "USER_MANAGEMENT",
    description: "Delete users",
    isSystemPermission: true
  },

  // ============================================================
  // TEAM
  // ============================================================

  {
    key: "team.read",
    resource: "team",
    action: "read",
    category: "TEAM_MANAGEMENT",
    description: "View teams",
    isSystemPermission: true
  },
  {
    key: "team.create",
    resource: "team",
    action: "create",
    category: "TEAM_MANAGEMENT",
    description: "Create teams",
    isSystemPermission: true
  },
  {
    key: "team.update",
    resource: "team",
    action: "update",
    category: "TEAM_MANAGEMENT",
    description: "Update team information",
    isSystemPermission: true
  },
  {
    key: "team.delete",
    resource: "team",
    action: "delete",
    category: "TEAM_MANAGEMENT",
    description: "Delete teams",
    isSystemPermission: true
  },

  // ============================================================
  // MEMBERSHIP
  // ============================================================

  {
    key: "membership.read",
    resource: "membership",
    action: "read",
    category: "TEAM_MANAGEMENT",
    description: "View team memberships",
    isSystemPermission: true
  },
  {
    key: "membership.create",
    resource: "membership",
    action: "create",
    category: "TEAM_MANAGEMENT",
    description: "Add users to teams",
    isSystemPermission: true
  },
  {
    key: "membership.update",
    resource: "membership",
    action: "update",
    category: "TEAM_MANAGEMENT",
    description: "Update team membership",
    isSystemPermission: true
  },
  {
    key: "membership.remove",
    resource: "membership",
    action: "remove",
    category: "TEAM_MANAGEMENT",
    description: "Remove users from teams",
    isSystemPermission: true
  },

  // ============================================================
  // ROLE
  // ============================================================

  {
    key: "role.read",
    resource: "role",
    action: "read",
    category: "AUTHORIZATION",
    description: "View roles",
    isSystemPermission: true
  },
  {
    key: "role.create",
    resource: "role",
    action: "create",
    category: "AUTHORIZATION",
    description: "Create roles",
    isSystemPermission: true
  },
  {
    key: "role.update",
    resource: "role",
    action: "update",
    category: "AUTHORIZATION",
    description: "Update roles",
    isSystemPermission: true
  },
  {
    key: "role.delete",
    resource: "role",
    action: "delete",
    category: "AUTHORIZATION",
    description: "Delete roles",
    isSystemPermission: true
  },
  {
    key: "role.assign",
    resource: "role",
    action: "assign",
    category: "AUTHORIZATION",
    description: "Assign roles to team members",
    isSystemPermission: true
  },
  {
    key: "role.revoke",
    resource: "role",
    action: "revoke",
    category: "AUTHORIZATION",
    description: "Revoke roles from team members",
    isSystemPermission: true
  },

  // ============================================================
  // PERMISSION
  // ============================================================

  {
    key: "permission.read",
    resource: "permission",
    action: "read",
    category: "AUTHORIZATION",
    description: "View available permissions",
    isSystemPermission: true
  },
  {
    key: "permission.assign",
    resource: "permission",
    action: "assign",
    category: "AUTHORIZATION",
    description: "Assign permissions to roles",
    isSystemPermission: true
  },

  // ============================================================
  // INVITATION
  // ============================================================

  {
    key: "invitation.read",
    resource: "invitation",
    action: "read",
    category: "USER_MANAGEMENT",
    description: "View user invitations",
    isSystemPermission: true
  },
  {
    key: "invitation.create",
    resource: "invitation",
    action: "create",
    category: "USER_MANAGEMENT",
    description: "Invite users by email",
    isSystemPermission: true
  },
  {
    key: "invitation.resend",
    resource: "invitation",
    action: "resend",
    category: "USER_MANAGEMENT",
    description: "Resend user invitations",
    isSystemPermission: true
  },
  {
    key: "invitation.revoke",
    resource: "invitation",
    action: "revoke",
    category: "USER_MANAGEMENT",
    description: "Revoke pending invitations",
    isSystemPermission: true
  },

  // ============================================================
  // ACCESS REQUEST
  // ============================================================

  {
    key: "access_request.read",
    resource: "access_request",
    action: "read",
    category: "ACCESS_CONTROL",
    description: "View access requests",
    isSystemPermission: true
  },
  {
    key: "access_request.create",
    resource: "access_request",
    action: "create",
    category: "ACCESS_CONTROL",
    description: "Request access to restricted resources",
    isSystemPermission: true
  },
  {
    key: "access_request.approve",
    resource: "access_request",
    action: "approve",
    category: "ACCESS_CONTROL",
    description: "Approve access requests",
    isSystemPermission: true
  },
  {
    key: "access_request.reject",
    resource: "access_request",
    action: "reject",
    category: "ACCESS_CONTROL",
    description: "Reject access requests",
    isSystemPermission: true
  },
  {
    key: "access_request.cancel",
    resource: "access_request",
    action: "cancel",
    category: "ACCESS_CONTROL",
    description: "Cancel access requests",
    isSystemPermission: true
  },

  // ============================================================
  // ACCESS GRANT
  // ============================================================

  {
    key: "access_grant.read",
    resource: "access_grant",
    action: "read",
    category: "ACCESS_CONTROL",
    description: "View direct access grants",
    isSystemPermission: true
  },
  {
    key: "access_grant.create",
    resource: "access_grant",
    action: "create",
    category: "ACCESS_CONTROL",
    description: "Grant direct resource-level access",
    isSystemPermission: true
  },
  {
    key: "access_grant.revoke",
    resource: "access_grant",
    action: "revoke",
    category: "ACCESS_CONTROL",
    description: "Revoke direct resource-level access",
    isSystemPermission: true
  },

  // ============================================================
  // NOTIFICATION
  // ============================================================

  {
    key: "notification.read",
    resource: "notification",
    action: "read",
    category: "NOTIFICATION",
    description: "View notifications",
    isSystemPermission: true
  },
  {
    key: "notification.update",
    resource: "notification",
    action: "update",
    category: "NOTIFICATION",
    description: "Update notification state",
    isSystemPermission: true
  },

  // ============================================================
  // AUDIT
  // ============================================================

  {
    key: "audit.read",
    resource: "audit",
    action: "read",
    category: "SECURITY",
    description: "View audit logs",
    isSystemPermission: true
  },

  // ============================================================
  // TASK
  // ============================================================

  {
    key: "task.read",
    resource: "task",
    action: "read",
    category: "TASK_MANAGEMENT",
    description: "View tasks",
    isSystemPermission: true
  },
  {
    key: "task.create",
    resource: "task",
    action: "create",
    category: "TASK_MANAGEMENT",
    description: "Create tasks",
    isSystemPermission: true
  },
  {
    key: "task.update",
    resource: "task",
    action: "update",
    category: "TASK_MANAGEMENT",
    description: "Update tasks",
    isSystemPermission: true
  },
  {
    key: "task.delete",
    resource: "task",
    action: "delete",
    category: "TASK_MANAGEMENT",
    description: "Delete tasks",
    isSystemPermission: true
  },
];