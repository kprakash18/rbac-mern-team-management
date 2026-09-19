import { useState } from 'react';

const getMemberIdentity = (member) => member?.id || member?._id || member?.email;

const withUpdatedMemberRoles = (members = [], targetMember, roles) =>
  members.map((member) =>
    getMemberIdentity(member) === getMemberIdentity(targetMember)
      ? { ...member, roles }
      : member
  );

export function useTeamRoleMutations({
  availableRoles,
  membersDrawer,
  selectedTeamForRoles,
  setSelectedTeamForRoles,
  setTeams,
  workspaceEditor,
  showToast,
}) {
  const [roleRemovalData, setRoleRemovalData] = useState(null);
  const [roleRemovalLoading, setRoleRemovalLoading] = useState(false);

  const applyMemberRoleUpdate = (teamId, member, roles) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? { ...team, members: withUpdatedMemberRoles(team.members, member, roles) }
          : team
      )
    );

    if (membersDrawer.selectedTeam?.id === teamId) {
      membersDrawer.setSelectedTeam((prev) => ({
        ...prev,
        members: withUpdatedMemberRoles(prev.members, member, roles),
      }));
    }

    if (workspaceEditor.editingTeam?.id === teamId) {
      workspaceEditor.setEditingTeam((prev) => ({
        ...prev,
        members: withUpdatedMemberRoles(prev.members, member, roles),
      }));
    }
  };

  const addMemberRole = async (targetTeam, member, roleName) => {
    if (!roleName) return;
    const currentRoles = member.roles || [];
    if (currentRoles.includes(roleName)) {
      showToast(`${member.name} already has the "${roleName}" role.`, 'warning');
      return;
    }

    const updatedRoles = [...currentRoles, roleName];
    applyMemberRoleUpdate(targetTeam.id, member, updatedRoles);
    showToast(`Added role "${roleName}" to ${member.name}.`);
  };

  const removeMemberRoleDirectly = (targetTeam, member, roleToRemove) => {
    const currentRoles = member.roles || [];
    const updatedRoles = currentRoles.filter((role) => role !== roleToRemove);
    applyMemberRoleUpdate(targetTeam.id, member, updatedRoles);
    showToast(`Removed role "${roleToRemove}" from ${member.name}.`);
  };

  const initiateRemoveMemberRole = (targetTeam, member, roleToRemove) => {
    const currentRoles = member.roles || [];
    if (currentRoles.length <= 1) {
      const defaultReplacement =
        availableRoles.find((role) => role.name !== roleToRemove)?.name || 'Developer';
      setRoleRemovalData({
        team: targetTeam,
        member,
        roleToRemove,
        replacementRole: defaultReplacement,
      });
      return;
    }

    removeMemberRoleDirectly(targetTeam, member, roleToRemove);
  };

  const confirmMemberRoleReassignment = async (event) => {
    event.preventDefault();
    if (!roleRemovalData) return;

    try {
      setRoleRemovalLoading(true);
      const { team, member, roleToRemove, replacementRole } = roleRemovalData;
      const currentRoles = member.roles || [];
      const updatedRoles = currentRoles
        .filter((role) => role !== roleToRemove)
        .concat(replacementRole ? [replacementRole] : []);

      const finalRoles = Array.from(new Set(updatedRoles));
      applyMemberRoleUpdate(team.id, member, finalRoles);
      showToast(`Reassigned ${member.name} from "${roleToRemove}" to "${replacementRole}".`);
      setRoleRemovalData(null);
    } catch (err) {
      console.error('Failed to reassign member role:', err);
      showToast('Failed to update member role.', 'error');
    } finally {
      setRoleRemovalLoading(false);
    }
  };

  const updateTeamMembers = (teamId, updatedMembers) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            members: updatedMembers,
            membersCount: updatedMembers.length,
          };
        }
        return team;
      })
    );

    if (selectedTeamForRoles?.id === teamId) {
      setSelectedTeamForRoles((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }

    if (membersDrawer.selectedTeam?.id === teamId) {
      membersDrawer.setSelectedTeam((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }

    if (workspaceEditor.editingTeam?.id === teamId) {
      workspaceEditor.setEditingTeam((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }
  };

  return {
    roleRemovalData,
    roleRemovalLoading,
    setRoleRemovalData,
    addMemberRole,
    initiateRemoveMemberRole,
    confirmMemberRoleReassignment,
    updateTeamMembers,
  };
}
