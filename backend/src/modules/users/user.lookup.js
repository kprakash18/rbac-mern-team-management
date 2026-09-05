import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";

/**
 * Enriches a list of raw User documents with their team workspaces and primary roles.
 *
 * @param {Array<Object>} users - Array of raw user objects/documents
 * @returns {Promise<Array<Object>>} Enriched user objects with `workspaces` array
 */
export async function enrichUsersWithWorkspaces(users = []) {
  if (!Array.isArray(users) || users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u._id || u.id);

  // 1. Fetch active team memberships for all users
  const memberships = await Membership.find({
    userId: { $in: userIds },
    status: { $ne: "REMOVED" },
  })
    .populate("teamId", "name")
    .lean();

  const membershipIds = memberships.map((m) => m._id);

  // 2. Fetch active roles assigned to these memberships
  const memberRoles = await MembershipRole.find({
    membershipId: { $in: membershipIds },
    revokedAt: null,
  })
    .populate("roleId", "name")
    .lean();

  // 3. Map workspaces & roles back to each user
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
