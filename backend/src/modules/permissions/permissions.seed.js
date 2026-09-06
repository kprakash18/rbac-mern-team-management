const PERMISSION_DEFINITIONS = [
  ['user.read', 'user', 'read', 'USER_MANAGEMENT', 'View users'],
  ['user.create', 'user', 'create', 'USER_MANAGEMENT', 'Create users'],
  ['user.update', 'user', 'update', 'USER_MANAGEMENT', 'Update user information'],
  ['user.delete', 'user', 'delete', 'USER_MANAGEMENT', 'Delete users'],
  ['invitation.read', 'invitation', 'read', 'USER_MANAGEMENT', 'View user invitations'],
  ['invitation.create', 'invitation', 'create', 'USER_MANAGEMENT', 'Invite users by email'],
  ['invitation.resend', 'invitation', 'resend', 'USER_MANAGEMENT', 'Resend user invitations'],
  ['invitation.revoke', 'invitation', 'revoke', 'USER_MANAGEMENT', 'Revoke pending invitations'],

  ['team.read', 'team', 'read', 'TEAM_MANAGEMENT', 'View teams'],
  ['team.create', 'team', 'create', 'TEAM_MANAGEMENT', 'Create teams'],
  ['team.update', 'team', 'update', 'TEAM_MANAGEMENT', 'Update team information'],
  ['team.delete', 'team', 'delete', 'TEAM_MANAGEMENT', 'Delete teams'],
  ['membership.read', 'membership', 'read', 'TEAM_MANAGEMENT', 'View team memberships'],
  ['membership.create', 'membership', 'create', 'TEAM_MANAGEMENT', 'Add users to teams'],
  ['membership.update', 'membership', 'update', 'TEAM_MANAGEMENT', 'Update team membership'],
  ['membership.remove', 'membership', 'remove', 'TEAM_MANAGEMENT', 'Remove users from teams'],

  ['role.read', 'role', 'read', 'AUTHORIZATION', 'View roles'],
  ['role.create', 'role', 'create', 'AUTHORIZATION', 'Create roles'],
  ['role.update', 'role', 'update', 'AUTHORIZATION', 'Update roles'],
  ['role.delete', 'role', 'delete', 'AUTHORIZATION', 'Delete roles'],
  ['role.assign', 'role', 'assign', 'AUTHORIZATION', 'Assign roles to team members'],
  ['role.revoke', 'role', 'revoke', 'AUTHORIZATION', 'Revoke roles from team members'],
  ['permission.read', 'permission', 'read', 'AUTHORIZATION', 'View available permissions'],
  ['permission.assign', 'permission', 'assign', 'AUTHORIZATION', 'Assign permissions to roles'],

  ['access_request.read', 'access_request', 'read', 'ACCESS_CONTROL', 'View access requests'],
  ['access_request.create', 'access_request', 'create', 'ACCESS_CONTROL', 'Request access to restricted resources'],
  ['access_request.approve', 'access_request', 'approve', 'ACCESS_CONTROL', 'Approve access requests'],
  ['access_request.reject', 'access_request', 'reject', 'ACCESS_CONTROL', 'Reject access requests'],
  ['access_request.cancel', 'access_request', 'cancel', 'ACCESS_CONTROL', 'Cancel access requests'],
  ['access_grant.read', 'access_grant', 'read', 'ACCESS_CONTROL', 'View direct access grants'],
  ['access_grant.create', 'access_grant', 'create', 'ACCESS_CONTROL', 'Grant direct resource-level access'],
  ['access_grant.revoke', 'access_grant', 'revoke', 'ACCESS_CONTROL', 'Revoke direct resource-level access'],

  ['notification.read', 'notification', 'read', 'NOTIFICATION', 'View notifications'],
  ['notification.update', 'notification', 'update', 'NOTIFICATION', 'Update notification state'],
  ['audit.read', 'audit', 'read', 'SECURITY', 'View audit logs'],
  ['task.read', 'task', 'read', 'TASK_MANAGEMENT', 'View tasks'],
  ['task.create', 'task', 'create', 'TASK_MANAGEMENT', 'Create tasks'],
  ['task.update', 'task', 'update', 'TASK_MANAGEMENT', 'Update tasks'],
  ['task.delete', 'task', 'delete', 'TASK_MANAGEMENT', 'Delete tasks'],
];

export const permissionSeedData = PERMISSION_DEFINITIONS.map(
  ([key, resource, action, category, description]) => ({
    key,
    resource,
    action,
    category,
    description,
    isSystemPermission: true,
  })
);
