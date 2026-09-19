import { useEffect, useState } from 'react';
import { DEFAULT_WORKSPACE, WORKSPACE_ROLES_MAP } from '@/constants';
import api from '@/lib/api';

const makeTempId = () => `asg-${Math.random().toString(36).slice(2, 9)}`;

function buildAssignment(team, role, workspaceFallback) {
  return {
    tempId: makeTempId(),
    teamId: team?._id || team?.id || '',
    workspace: team?.name || workspaceFallback || DEFAULT_WORKSPACE,
    roleId: role?._id || role?.id || '',
    role: role?.name || 'Developer',
    isTeamAdmin: false,
  };
}

export function useCreateUserForm({ existingUsers, isOpen, onClose, onInvite }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([buildAssignment()]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    Promise.allSettled([
      api.get('/api/teams?status=ACTIVE'),
      api.get('/api/roles?status=all'),
    ]).then(([teamsRes, rolesRes]) => {
      const activeTeams = teamsRes.status === 'fulfilled'
        ? (teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []).filter((team) => team.status !== 'ARCHIVED')
        : [];
      const activeRoles = rolesRes.status === 'fulfilled'
        ? (rolesRes.value.data?.data?.roles || rolesRes.value.data?.data || [])
        : [];

      if (Array.isArray(activeTeams) && activeTeams.length > 0) setTeams(activeTeams);
      if (Array.isArray(activeRoles) && activeRoles.length > 0) setRoles(activeRoles);
      setAssignments([buildAssignment(activeTeams[0], activeRoles[0], DEFAULT_WORKSPACE)]);
    });
  }, [isOpen]);

  const workspaceOptions = teams.length > 0 ? teams.map((team) => team.name) : Object.keys(WORKSPACE_ROLES_MAP);
  const availableRoleNames = roles.length > 0 ? Array.from(new Set(roles.map((role) => role.name))) : ['Admin', 'Developer', 'Viewer', 'Editor', 'Manager'];
  const matchedUser = existingUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  const isExistingUser = Boolean(matchedUser);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setAssignments([buildAssignment(teams[0], roles[0], workspaceOptions[0])]);
    setIsSuperAdmin(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    const match = existingUsers.find((user) => user.email.toLowerCase() === newEmail.trim().toLowerCase());
    if (match?.name) setFullName(match.name);
  };

  const handleAddAssignment = () => {
    const assignedTeamIds = assignments.map((assignment) => assignment.teamId || assignment.workspace);
    const nextTeam = teams.find((team) => !assignedTeamIds.includes(team._id || team.id) && !assignedTeamIds.includes(team.name)) || teams[0];
    setAssignments((prev) => [...prev, buildAssignment(nextTeam, roles[0], workspaceOptions[0] || 'Engineering Core')]);
  };

  const handleRemoveAssignment = (index) => {
    if (assignments.length <= 1) return;
    setAssignments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleWorkspaceChange = (index, selectedValue) => {
    const matchedTeam = teams.find((team) => String(team._id || team.id) === String(selectedValue) || team.name === selectedValue);
    const workspaceName = matchedTeam ? matchedTeam.name : selectedValue;
    const availableRoles = WORKSPACE_ROLES_MAP[workspaceName] || ['Viewer'];
    const nextRole = availableRoles.includes(assignments[index]?.role) ? assignments[index].role : (roles[0]?.name || availableRoles[0]);
    const nextRoleId = roles.find((role) => role.name === nextRole)?._id || assignments[index]?.roleId;

    setAssignments((prev) => prev.map((assignment, itemIndex) => (
      itemIndex === index
        ? { ...assignment, teamId: matchedTeam?._id || matchedTeam?.id || assignment.teamId, workspace: workspaceName, role: nextRole, roleId: nextRoleId }
        : assignment
    )));
  };

  const handleRoleChange = (index, selectedValue) => {
    const matchedRole = roles.find((role) => String(role._id || role.id) === String(selectedValue) || role.name === selectedValue);
    setAssignments((prev) => prev.map((assignment, itemIndex) => (
      itemIndex === index
        ? { ...assignment, roleId: matchedRole?._id || matchedRole?.id || assignment.roleId, role: matchedRole?.name || selectedValue }
        : assignment
    )));
  };

  const handleTeamAdminChange = (index, isTeamAdmin) => {
    setAssignments((prev) => prev.map((assignment, itemIndex) => (itemIndex === index ? { ...assignment, isTeamAdmin } : assignment)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const primaryAssignment = assignments[0] || {};
    const primaryTeamId = primaryAssignment.teamId || teams.find((team) => team.name === primaryAssignment.workspace)?._id || teams[0]?._id;
    const matchedTeam = teams.find((team) => String(team._id || team.id) === String(primaryTeamId)) || teams[0];
    const primaryRoleId = primaryAssignment.roleId || roles.find((role) => role.name === primaryAssignment.role)?._id || roles[0]?._id;
    const matchedRole = roles.find((role) => String(role._id || role.id) === String(primaryRoleId)) || roles[0];

    onInvite?.({
      fullName,
      email,
      assignments: assignments.map((assignment) => {
        const teamMatch = teams.find((team) => String(team._id || team.id) === String(assignment.teamId) || team.name?.toLowerCase() === assignment.workspace?.toLowerCase());
        const roleMatch = roles.find((role) => String(role._id || role.id) === String(assignment.roleId) || role.name?.toLowerCase() === assignment.role?.toLowerCase());
        return {
          ...assignment,
          teamId: teamMatch?._id || teamMatch?.id,
          workspace: teamMatch?.name || assignment.workspace,
          roleId: roleMatch?._id || roleMatch?.id,
          role: roleMatch?.name || assignment.role,
        };
      }),
      teamId: matchedTeam?._id || matchedTeam?.id,
      roleId: matchedRole?._id || matchedRole?.id,
      workspace: matchedTeam?.name || primaryAssignment.workspace,
      role: matchedRole?.name || primaryAssignment.role,
      isTeamAdmin: assignments.some((assignment) => assignment.isTeamAdmin),
      isSuperAdmin,
      isExistingUser,
    });

    resetForm();
    onClose();
  };

  return {
    assignments,
    availableRoleNames,
    email,
    fullName,
    isExistingUser,
    isSuperAdmin,
    roles,
    teams,
    workspaceOptions,
    handleAddAssignment,
    handleClose,
    handleEmailChange,
    handleRemoveAssignment,
    handleRoleChange,
    handleSubmit,
    handleTeamAdminChange,
    handleWorkspaceChange,
    setFullName,
    setIsSuperAdmin,
  };
}
