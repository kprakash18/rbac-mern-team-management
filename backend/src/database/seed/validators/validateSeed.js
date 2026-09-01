import Permission from "../../../modules/permissions/permission.model.js";
import Role from "../../../modules/roles/role.model.js";
import RolePermission from "../../../modules/roles/role-permission.model.js";
import User from "../../../modules/users/user.model.js";
import Team from "../../../modules/teams/team.model.js";
import Membership from "../../../modules/memberships/membership.model.js";
import MembershipRole from "../../../modules/member-roles/member-role.model.js";
import Task from "../../../modules/tasks/task.model.js";

import Invitation from "../../../modules/invitations/invitation.model.js";
import AccessRequest from "../../../modules/access/access-request.model.js";
import AccessGrant from "../../../modules/access/access-grant.model.js";
import Notification from "../../../modules/notifications/notification.model.js";
import AuditLog from "../../../modules/audit/audit-log.model.js";

/**
 * Validate post-seed referential integrity and authorization test scenario contracts.
 */
export async function validateSeed() {
  console.log("\n========================================================");
  console.log("             RUNNING SEED VALIDATION CHECKS");
  console.log("========================================================");

  const errors = [];
  const checks = [];

  const recordCheck = (name, passed, detail = "") => {
    checks.push({ Check: name, Status: passed ? "PASSED" : "FAILED", Detail: detail });
    if (!passed) {
      errors.push(`[FAILED] ${name}: ${detail}`);
    }
  };

  try {
    // ----------------------------------------------------
    // 1. Referential Integrity Checks
    // ----------------------------------------------------

    // Role -> User (createdBy)
    const roles = await Role.find({}).populate("createdBy");
    const invalidRoles = roles.filter((r) => !r.createdBy);
    recordCheck(
      "Roles referential integrity (createdBy -> User)",
      invalidRoles.length === 0,
      invalidRoles.length > 0 ? `${invalidRoles.length} orphaned roles found` : "All roles have valid creators"
    );

    // RolePermission -> Role & Permission
    const rolePerms = await RolePermission.find({}).populate("roleId permissionId");
    const invalidRolePerms = rolePerms.filter((rp) => !rp.roleId || !rp.permissionId);
    recordCheck(
      "RolePermission referential integrity (roleId & permissionId)",
      invalidRolePerms.length === 0,
      invalidRolePerms.length > 0
        ? `${invalidRolePerms.length} broken role-permission mappings`
        : "All role-permissions valid"
    );

    // Team -> User (createdBy)
    const teams = await Team.find({}).populate("createdBy");
    const invalidTeams = teams.filter((t) => !t.createdBy);
    recordCheck(
      "Teams referential integrity (createdBy -> User)",
      invalidTeams.length === 0,
      invalidTeams.length > 0 ? `${invalidTeams.length} orphaned teams found` : "All teams have valid creators"
    );

    // Membership -> User & Team
    const memberships = await Membership.find({}).populate("userId teamId");
    const invalidMemberships = memberships.filter((m) => !m.userId || !m.teamId);
    recordCheck(
      "Memberships referential integrity (userId & teamId)",
      invalidMemberships.length === 0,
      invalidMemberships.length > 0
        ? `${invalidMemberships.length} broken memberships`
        : "All memberships valid"
    );

    // MembershipRole -> Membership & Role
    const memRoles = await MembershipRole.find({}).populate("membershipId roleId");
    const invalidMemRoles = memRoles.filter((mr) => !mr.membershipId || !mr.roleId);
    recordCheck(
      "MembershipRole referential integrity (membershipId & roleId)",
      invalidMemRoles.length === 0,
      invalidMemRoles.length > 0
        ? `${invalidMemRoles.length} broken membership roles`
        : "All membership roles valid"
    );

    // Task -> Team & User
    const tasks = await Task.find({}).populate("teamId createdBy");
    const invalidTasks = tasks.filter((t) => !t.teamId || !t.createdBy);
    recordCheck(
      "Tasks referential integrity (teamId & createdBy)",
      invalidTasks.length === 0,
      invalidTasks.length > 0 ? `${invalidTasks.length} broken tasks` : "All tasks valid"
    );

    // AccessGrant -> User, Team, Permission
    const grants = await AccessGrant.find({}).populate("userId teamId permissionId");
    const invalidGrants = grants.filter((g) => !g.userId || !g.teamId || !g.permissionId);
    recordCheck(
      "AccessGrants referential integrity (userId, teamId, permissionId)",
      invalidGrants.length === 0,
      invalidGrants.length > 0 ? `${invalidGrants.length} broken grants` : "All grants valid"
    );

    // AccessRequest -> Requester, Target, Team, Permission
    const requests = await AccessRequest.find({}).populate("requesterId targetUserId teamId permissionId");
    const invalidRequests = requests.filter((r) => !r.requesterId || !r.targetUserId || !r.teamId || !r.permissionId);
    recordCheck(
      "AccessRequests referential integrity (users, team, permission)",
      invalidRequests.length === 0,
      invalidRequests.length > 0 ? `${invalidRequests.length} broken requests` : "All requests valid"
    );

    // ----------------------------------------------------
    // 2. Scenario Checks
    // ----------------------------------------------------

    // Scenario: Alice cross-team roles (Admin in Eng, Viewer in Research)
    const alice = await User.findOne({ email: "alice@example.com" });
    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const resTeam = await Team.findOne({ name: "Research & AI Lab" });
    const prodTeam = await Team.findOne({ name: "Product & Design" });

    let aliceScenarioPassed = false;
    if (alice && engTeam && resTeam) {
      const aliceEngMem = await Membership.findOne({ userId: alice._id, teamId: engTeam._id });
      const aliceResMem = await Membership.findOne({ userId: alice._id, teamId: resTeam._id });
      const aliceEngRole = await MembershipRole.findOne({ membershipId: aliceEngMem?._id }).populate("roleId");
      const aliceResRole = await MembershipRole.findOne({ membershipId: aliceResMem?._id }).populate("roleId");

      aliceScenarioPassed =
        aliceEngRole?.roleId?.name === "Team Admin" && aliceResRole?.roleId?.name === "Viewer";
    }
    recordCheck(
      "Scenario: Alice multi-team roles (Eng: Team Admin, Research: Viewer)",
      aliceScenarioPassed,
      aliceScenarioPassed ? "Verified dual role assignments" : "Alice missing expected team roles"
    );

    // Scenario: Charlie active temporary grant for task.update on real Task ObjectId
    const charlie = await User.findOne({ email: "charlie@example.com" });
    let charlieGrantPassed = false;
    if (charlie && engTeam) {
      const charlieGrant = await AccessGrant.findOne({
        userId: charlie._id,
        teamId: engTeam._id,
        status: "ACTIVE",
      }).populate("permissionId");

      if (charlieGrant && charlieGrant.resource.startsWith("task:") && charlieGrant.permissionId.key === "task.update") {
        const taskId = charlieGrant.resource.split(":")[1];
        const realTask = await Task.findById(taskId);
        charlieGrantPassed = Boolean(realTask && charlieGrant.expiresAt > new Date());
      }
    }
    recordCheck(
      "Scenario: Charlie active temporary grant on real Task ObjectId",
      charlieGrantPassed,
      charlieGrantPassed ? "Verified task.update grant on concrete task" : "Charlie grant missing or broken"
    );

    // Scenario: David pending access request on real Task ObjectId
    const david = await User.findOne({ email: "david@example.com" });
    let davidRequestPassed = false;
    if (david && engTeam) {
      const davidReq = await AccessRequest.findOne({
        requesterId: david._id,
        teamId: engTeam._id,
        status: "PENDING",
      }).populate("permissionId");

      if (davidReq && davidReq.resource.startsWith("task:") && davidReq.permissionId.key === "task.delete") {
        const taskId = davidReq.resource.split(":")[1];
        const realTask = await Task.findById(taskId);
        davidRequestPassed = Boolean(realTask);
      }
    }
    recordCheck(
      "Scenario: David pending access request for task.delete on real Task",
      davidRequestPassed,
      davidRequestPassed ? "Verified pending request on concrete task" : "David request missing or broken"
    );

    // Scenario: Frank suspended in Research & roleless in Product
    const frank = await User.findOne({ email: "frank@example.com" });
    let frankScenarioPassed = false;
    if (frank && resTeam && prodTeam) {
      const frankResMem = await Membership.findOne({ userId: frank._id, teamId: resTeam._id });
      const frankProdMem = await Membership.findOne({ userId: frank._id, teamId: prodTeam._id });
      const prodRolesCount = await MembershipRole.countDocuments({ membershipId: frankProdMem?._id });

      frankScenarioPassed =
        frankResMem?.status === "SUSPENDED" &&
        frankProdMem?.status === "ACTIVE" &&
        prodRolesCount === 0;
    }
    recordCheck(
      "Scenario: Frank suspended in Research & roleless member in Product",
      frankScenarioPassed,
      frankScenarioPassed ? "Verified suspended & roleless membership states" : "Frank scenario conditions not met"
    );

    // Scenario: Grace invited user state & invitation tokenHash
    const grace = await User.findOne({ email: "grace@example.com" });
    let graceScenarioPassed = false;
    if (grace && engTeam) {
      const graceInv = await Invitation.findOne({
        email: "grace@example.com",
        teamId: engTeam._id,
        status: "PENDING",
      });

      graceScenarioPassed =
        grace.accountStatus === "INVITED" &&
        grace.mustChangePassword === true &&
        Boolean(graceInv && graceInv.tokenHash && graceInv.tokenHash.length === 64);
    }
    recordCheck(
      "Scenario: Grace invited user (mustChangePassword=true, SHA-256 tokenHash)",
      graceScenarioPassed,
      graceScenarioPassed ? "Verified invited state & token hash" : "Grace invited scenario conditions not met"
    );

    // Scenario: Hannah role revoked (active member, 0 roles, ROLE_REVOKED audit log + notification)
    const hannah = await User.findOne({ email: "hannah@example.com" });
    let hannahScenarioPassed = false;
    if (hannah && engTeam) {
      const hannahMem = await Membership.findOne({ userId: hannah._id, teamId: engTeam._id });
      const hannahRolesCount = await MembershipRole.countDocuments({ membershipId: hannahMem?._id });
      const auditRevoked = await AuditLog.findOne({ action: "ROLE_REVOKED", targetId: hannah._id });
      const notifRevoked = await Notification.findOne({ recipientId: hannah._id, type: "ROLE_REVOKED" });

      hannahScenarioPassed =
        hannahMem?.status === "ACTIVE" &&
        hannahRolesCount === 0 &&
        Boolean(auditRevoked) &&
        Boolean(notifRevoked);
    }
    recordCheck(
      "Scenario: Hannah revoked role (0 active roles, audit log & notification logged)",
      hannahScenarioPassed,
      hannahScenarioPassed ? "Verified role revocation history & zero active roles" : "Hannah scenario conditions not met"
    );

    // Scenario: Ian expired grant
    const ian = await User.findOne({ email: "ian@example.com" });
    let ianScenarioPassed = false;
    if (ian && engTeam) {
      const expiredGrant = await AccessGrant.findOne({
        userId: ian._id,
        teamId: engTeam._id,
        status: "EXPIRED",
      });
      ianScenarioPassed = Boolean(expiredGrant && expiredGrant.expiresAt < new Date());
    }
    recordCheck(
      "Scenario: Ian expired grant (status=EXPIRED, expiresAt in past)",
      ianScenarioPassed,
      ianScenarioPassed ? "Verified expired grant record" : "Ian expired grant scenario not met"
    );
  } catch (err) {
    errors.push(`Validation exception: ${err.message}`);
  }

  console.table(checks);

  if (errors.length > 0) {
    console.error("\n❌ Seed validation encountered failures:");
    for (const err of errors) console.error(`  - ${err}`);
    throw new Error(`Seed validation failed with ${errors.length} error(s).`);
  }

  console.log("\n✅ All seed referential integrity and authorization scenario checks PASSED successfully.\n");
}
