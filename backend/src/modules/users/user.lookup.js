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

  const memberRoles = membershipIds.length > 0
    ? await MembershipRole.find({
        membershipId: { $in: membershipIds },
        revokedAt: null,
      })
        .populate("roleId", "name")
        .lean()
    : [];

  // Group roles by membershipId for O(1) lookup
  const rolesByMembership = new Map();
  for (const mr of memberRoles) {
    const memId = String(mr.membershipId);
    const roleName = typeof mr.roleId === "object" ? mr.roleId?.name : mr.roleId;
    if (typeof roleName === "string") {
      if (!rolesByMembership.has(memId)) {
        rolesByMembership.set(memId, []);
      }
      rolesByMembership.get(memId).push(roleName);
    }
  }

  // Group memberships by userId for O(1) lookup
  const membershipsByUser = new Map();
  for (const m of memberships) {
    const uId = String(m.userId);
    if (!membershipsByUser.has(uId)) {
      membershipsByUser.set(uId, []);
    }
    membershipsByUser.get(uId).push(m);
  }

  return users.map((u) => {
    const userIdStr = String(u._id || u.id);
    const userMemberships = membershipsByUser.get(userIdStr) || [];

    let userIsSuperAdmin = Boolean(u.isSuperAdmin);
    let userIsTeamAdmin = false;

    const workspaces = [];
    for (const m of userMemberships) {
      if (!m.teamId || !m.teamId.name) continue;

      const roles = rolesByMembership.get(String(m._id)) || [];

      const hasSuperAdmin = roles.includes("Super Admin") || roles.includes("Platform Super Admin");
      const hasTeamAdmin = roles.includes("Team Admin") || roles.some((r) => r.toLowerCase().includes("admin"));
      if (hasSuperAdmin) userIsSuperAdmin = true;
      if (hasTeamAdmin) userIsTeamAdmin = true;

      const primaryRole = hasSuperAdmin
        ? "Super Admin"
        : hasTeamAdmin
        ? "Team Admin"
        : (roles[0] || "Member");

      workspaces.push({
        id: m.teamId._id,
        name: m.teamId.name,
        role: primaryRole,
        isTeamAdmin: hasTeamAdmin || hasSuperAdmin,
      });
    }

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
