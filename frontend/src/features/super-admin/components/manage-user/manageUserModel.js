import { DEFAULT_WORKSPACE, WORKSPACE_ROLES_MAP } from '@/constants';

export const WORKSPACE_ICONS = {
  'Research & Development': 'biotech',
  'Engineering Core': 'dns',
  Engineering: 'dns',
  'Marketing Global': 'campaign',
  Marketing: 'campaign',
  'Finance Secure': 'payments',
  'Customer Support EU': 'support_agent',
  Production: 'precision_manufacturing',
  Staging: 'tune',
  Product: 'category',
  Design: 'palette',
};

export const STATUS_LABELS = {
  active: 'Active',
  disabled: 'Disabled',
  invited: 'Invited',
  suspended: 'Suspended',
};

export function normalizeUserWorkspaces(user) {
  return user?.workspaces?.map((workspace) => ({
    name: workspace.name,
    role: workspace.role || (WORKSPACE_ROLES_MAP[workspace.name] ? WORKSPACE_ROLES_MAP[workspace.name][0] : 'Developer'),
    isTeamAdmin: Boolean(workspace.isTeamAdmin ?? user?.isTeamAdmin),
  })) || [];
}

export function getWorkspaceOptions(teams) {
  return teams.length > 0
    ? Array.from(new Set([...teams.map((team) => team.name), ...Object.keys(WORKSPACE_ROLES_MAP)]))
    : Object.keys(WORKSPACE_ROLES_MAP);
}

export function getRoleOptions(roles) {
  return roles.length > 0
    ? Array.from(new Set(roles.map((role) => role.name)))
    : ['Admin', 'Developer', 'Viewer', 'Editor', 'Manager'];
}

export function getNextWorkspace({ workspaces, workspaceOptions }) {
  return (
    workspaceOptions.find((workspace) => !workspaces.some((item) => item.name === workspace)) ||
    workspaceOptions[0] ||
    DEFAULT_WORKSPACE
  );
}
