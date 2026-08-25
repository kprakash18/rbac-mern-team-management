import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Role from "./role.model.js";
import Permission from "../permissions/permission.model.js";
import MembershipRole from "../memberships/membership-role.model.js";
import RolePermission from "./role-permission.model.js";
import { roleService } from "./role.service.js";
import { permissionService } from "../permissions/permission.service.js";
import { membershipRoleService } from "../memberships/membership-role.service.js";
import { can } from "../authorization/authorization.service.js";

async function runRbacTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 4 Dynamic RBAC Test Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  let qaRole = null;

  try {
    await mongoose.connect(env.mongoUri);
    await MembershipRole.syncIndexes();
    console.log(" Connected to database for RBAC verification.\n");

    // Clean up test role artifacts from previous runs if any
    const existingQaRoles = await Role.find({ name: "QA Reviewer" });
    for (const r of existingQaRoles) {
      await MembershipRole.deleteMany({ roleId: r._id });
      await RolePermission.deleteMany({ roleId: r._id });
    }
    await Role.deleteMany({ name: "QA Reviewer" });

    // Load test fixtures
    const adminUser = await User.findOne({ email: "admin@system.local" });
    const alice = await User.findOne({ email: "alice@example.com" });
    const charlie = await User.findOne({ email: "charlie@example.com" });
    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const taskCreatePerm = await Permission.findOne({ key: "task.create" });

    // --- 1. Dynamic Custom Role Creation ---
    console.log("--- 1. Dynamic Custom Role Creation ---");
    qaRole = await roleService.createRole({
      name: "QA Reviewer",
      description: "Custom quality assurance role",
      permissionIds: [taskCreatePerm._id],
      createdBy: adminUser._id,
    });
    assert(qaRole && qaRole.isSystemRole === false, "Custom role created with isSystemRole: false");
    assert(qaRole.permissions.length === 1, "Custom role has exactly 1 permission attached");

    // --- 2. Dynamic Team-Scoped Role Assignment ---
    console.log("\n--- 2. Dynamic Team-Scoped Role Assignment ---");
    const assignment = await membershipRoleService.assignRoleToMember({
      teamId: engTeam._id,
      userId: charlie._id,
      roleId: qaRole._id,
      assignedBy: alice._id,
    });
    assert(assignment && assignment.revokedAt === null, "Role assigned to Charlie in Engineering Core");

    // --- 3. Immediate Authorization Decision Evaluation ---
    console.log("\n--- 3. Immediate Authorization Decision Evaluation ---");
    const canCreateTask = await can(charlie._id, engTeam._id, "task.create");
    const canDeleteTask = await can(charlie._id, engTeam._id, "task.delete");
    assert(canCreateTask === true, "Charlie has 'task.create' immediately via QA Reviewer role");
    assert(canDeleteTask === false, "Charlie is DENIED 'task.delete' (not in QA Reviewer)");

    // --- 4. Dynamic Role Disabling & Invalidation ---
    console.log("\n--- 4. Role Disabling & Invalidation ---");
    await roleService.updateRole(qaRole._id, { status: "DISABLED" });
    const canCreateWhenDisabled = await can(charlie._id, engTeam._id, "task.create");
    assert(canCreateWhenDisabled === false, "Charlie is immediately DENIED 'task.create' when role is DISABLED");

    // --- 5. Dynamic Role Re-Enabling ---
    console.log("\n--- 5. Role Re-Enabling ---");
    await roleService.updateRole(qaRole._id, { status: "ACTIVE" });
    const canCreateWhenReEnabled = await can(charlie._id, engTeam._id, "task.create");
    assert(canCreateWhenReEnabled === true, "Charlie has 'task.create' restored when role is ACTIVE");

    // --- 6. Auditable Soft Revocation ---
    console.log("\n--- 6. Auditable Soft Revocation ---");
    await membershipRoleService.revokeRoleAssignment({
      teamId: engTeam._id,
      userId: charlie._id,
      assignmentId: assignment._id,
      revokedBy: alice._id,
    });
    const canCreateAfterRevoke = await can(charlie._id, engTeam._id, "task.create");
    assert(canCreateAfterRevoke === false, "Charlie is immediately DENIED access after soft-revocation");

    const revokedDoc = await MembershipRole.findById(assignment._id);
    assert(revokedDoc && revokedDoc.revokedAt !== null, "Revoked assignment document preserved in MongoDB for audit history");

    // --- 7. System Role Immutability ---
    console.log("\n--- 7. System Role Immutability ---");
    const devRole = await Role.findOne({ name: "Developer", isSystemRole: true });
    let systemRoleMutationBlocked = false;
    try {
      await roleService.updateRole(devRole._id, { name: "Hacked Developer" });
    } catch (err) {
      systemRoleMutationBlocked = err.statusCode === 400;
    }
    assert(systemRoleMutationBlocked, "System role rename rejected with 400 Bad Request");

    let systemRoleDeleteBlocked = false;
    try {
      await roleService.deleteRole(devRole._id);
    } catch (err) {
      systemRoleDeleteBlocked = err.statusCode === 400;
    }
    assert(systemRoleDeleteBlocked, "System role deletion rejected with 400 Bad Request");

    // --- 8. Duplicate Active Assignment Rejection ---
    console.log("\n--- 8. Duplicate Active Assignment Rejection ---");
    // Assign a new active role to Charlie
    const newActiveAssignment = await membershipRoleService.assignRoleToMember({
      teamId: engTeam._id,
      userId: charlie._id,
      roleId: qaRole._id,
      assignedBy: alice._id,
    });
    assert(newActiveAssignment !== null, "Re-assignment after revocation succeeds as a new document");

    let duplicateBlocked = false;
    try {
      await membershipRoleService.assignRoleToMember({
        teamId: engTeam._id,
        userId: charlie._id,
        roleId: qaRole._id,
        assignedBy: alice._id,
      });
    } catch (err) {
      duplicateBlocked = err.statusCode === 409;
    }
    assert(duplicateBlocked, "Duplicate active role assignment rejected with 409 Conflict");

    // --- 9. Permission Catalog Filtering ---
    console.log("\n--- 9. Canonical Permission Catalog ---");
    const taskPerms = await permissionService.listPermissions({ category: "TASK_MANAGEMENT" });
    assert(taskPerms.length > 0 && taskPerms.every((p) => p.category === "TASK_MANAGEMENT"), "Permission catalog filters accurately by category");

    // Teardown test artifacts so subsequent suites remain cleanly isolated
    if (qaRole) {
      await MembershipRole.deleteMany({ roleId: qaRole._id });
      await RolePermission.deleteMany({ roleId: qaRole._id });
      await Role.deleteMany({ _id: qaRole._id });
    }

    // Summary
    console.log("\n==================================================");
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================\n");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("❌ Test suite encountered an unexpected error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runRbacTests();
