import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";

export async function enrichUsersWithWorkspaces(users = []) {
  if (!Array.isArray(users) || users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u._id || u.id);

  const memberships = await Membership.find({
    userId: { $in: userIds },
    status: { $ne: "REMOVED" },
  })
    .populate("teamId", "name")
    .lean();

  const membershipIds = memberships.map((m) => m._id);

  const memberRoles = await MembershipRole.find({
    membershipId: { $in: membershipIds },
    revokedAt: null,
  })
    .populate("roleId", "name")
    .lean();

  return users.map((u) => {
    const userMemberships = memberships.filter(
      (m) => String(m.userId) === String(u._id || u.id)
    );

    let userIsSuperAdmin = false;
    let userIsTeamAdmin = false;

    const workspaces = userMemberships
      .filter((m) => m.teamId && m.teamId.name)
      .map((m) => {
        const roles = memberRoles
          .filter((mr) => String(mr.membershipId) === String(m._id))
          .map((mr) => (typeof mr.roleId === "object" ? mr.roleId?.name : mr.roleId))
          .filter((name) => typeof name === "string");

        const hasSuperAdmin = roles.includes("Super Admin") || roles.includes("Platform Super Admin");
        const hasTeamAdmin = roles.includes("Team Admin") || roles.some((r) => r.toLowerCase().includes("admin"));
        if (hasSuperAdmin) userIsSuperAdmin = true;
        if (hasTeamAdmin) userIsTeamAdmin = true;

        const primaryRole = hasSuperAdmin
          ? "Super Admin"
          : hasTeamAdmin
          ? "Team Admin"
          : (roles[0] || "Member");

        return {
          id: m.teamId._id,
          name: m.teamId.name,
          role: primaryRole,
          isTeamAdmin: hasTeamAdmin || hasSuperAdmin,
        };
      });

    return {
      ...u,
      isSuperAdmin: userIsSuperAdmin,
      isTeamAdmin: userIsTeamAdmin,
      workspaces:
        workspaces.length > 0
          ? workspaces
          : [{ name: "Default Workspace", role: "Member", isTeamAdmin: false }],
    };
  });
}

export default enrichUsersWithWorkspaces;
