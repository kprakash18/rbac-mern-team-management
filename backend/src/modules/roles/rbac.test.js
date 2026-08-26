import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
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

describe("Phase 4: Dynamic RBAC Test Suite", () => {
  let admin, alice, charlie, engTeam, taskCreatePerm, qaRole, assignment;

  before(async () => {
    await mongoose.connect(env.mongoUri);
    await MembershipRole.syncIndexes();
    [admin, alice, charlie, engTeam, taskCreatePerm] = await Promise.all([
      User.findOne({ email: "admin@system.local" }),
      User.findOne({ email: "alice@example.com" }),
      User.findOne({ email: "charlie@example.com" }),
      Team.findOne({ name: "Engineering Core" }),
      Permission.findOne({ key: "task.create" }),
    ]);
  });

  after(async () => {
    if (qaRole) {
      await MembershipRole.deleteMany({ roleId: qaRole._id });
      await RolePermission.deleteMany({ roleId: qaRole._id });
      await Role.deleteMany({ _id: qaRole._id });
    }
    await mongoose.disconnect();
  });

  it("creates custom role and manages dynamic assignment lifecycle", async () => {
    qaRole = await roleService.createRole({ name: "QA Reviewer", permissionIds: [taskCreatePerm._id], createdBy: admin._id });
    assert.ok(qaRole && !qaRole.isSystemRole && qaRole.permissions.length === 1);

    assignment = await membershipRoleService.assignRoleToMember({ teamId: engTeam._id, userId: charlie._id, roleId: qaRole._id, assignedBy: alice._id });
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.create"), true);
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.delete"), false);

    // Disable -> Re-enable
    await roleService.updateRole(qaRole._id, { status: "DISABLED" });
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.create"), false);
    await roleService.updateRole(qaRole._id, { status: "ACTIVE" });
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.create"), true);

    // Soft Revocation & Audit Persistence
    await membershipRoleService.revokeRoleAssignment({ teamId: engTeam._id, userId: charlie._id, assignmentId: assignment._id, revokedBy: alice._id });
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.create"), false);
    assert.ok((await MembershipRole.findById(assignment._id)).revokedAt !== null);
  });

  it("enforces system role protections and assignment constraints", async () => {
    const devRole = await Role.findOne({ name: "Developer", isSystemRole: true });
    await assert.rejects(() => roleService.updateRole(devRole._id, { name: "Hacked" }), { statusCode: 400 });
    await assert.rejects(() => roleService.deleteRole(devRole._id), { statusCode: 400 });

    await membershipRoleService.assignRoleToMember({ teamId: engTeam._id, userId: charlie._id, roleId: qaRole._id, assignedBy: alice._id });
    await assert.rejects(() => membershipRoleService.assignRoleToMember({ teamId: engTeam._id, userId: charlie._id, roleId: qaRole._id, assignedBy: alice._id }), { statusCode: 409 });

    const taskPerms = await permissionService.listPermissions({ category: "TASK_MANAGEMENT" });
    assert.ok(taskPerms.length > 0 && taskPerms.every((p) => p.category === "TASK_MANAGEMENT"));
  });
});
