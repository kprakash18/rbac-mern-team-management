import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/database/connection.js";
import { env } from "../src/config/env.js";
import User from "../src/modules/users/user.model.js";
import Team from "../src/modules/teams/team.model.js";
import Role from "../src/modules/roles/role.model.js";
import Task from "../src/modules/tasks/task.model.js";
import Permission from "../src/modules/permissions/permission.model.js";
import Membership from "../src/modules/memberships/membership.model.js";
import AccessGrant from "../src/modules/access/access-grant.model.js";
import { getWorkspaceBootstrap } from "../src/modules/teams/team.service.js";
import { hashPassword } from "../src/common/security/password.js";

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  await User.deleteMany({ email: /@test-phase6\.local$/ });
  await Team.deleteMany({ name: /Test Phase6/ });
  await Role.deleteMany({ name: /Test Phase6/ });
  await Permission.deleteMany({ key: /test\.phase6\./ });
  await Task.deleteMany({ title: /Test Phase6/ });
  await AccessGrant.deleteMany({ resource: /test-phase6-/ });
  await disconnectDatabase();
});

test.describe("Phase 6 — Workspace Bootstrap API Tests", () => {

  test("1. getWorkspaceBootstrap returns team, roles, permissions, grants, and stats in 1 call", async () => {
    const user = await User.create({
      name: "Phase6 Member",
      email: `member-${Date.now()}@test-phase6.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const team = await Team.create({
      name: `Test Phase6 Team ${Date.now()}`,
      createdBy: user._id,
      status: "ACTIVE",
    });

    const perm1 = await Permission.create({
      key: `test.phase6.task_view_${Date.now()}`,
      resource: "task",
      action: "view",
      category: "TASK_MANAGEMENT",
    });

    const role = await Role.create({
      name: `Test Phase6 Role ${Date.now()}`,
      createdBy: user._id,
      status: "ACTIVE",
      permissions: [perm1.key],
    });

    await Membership.create({
      userId: user._id,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [role._id],
    });

    const task = await Task.create({
      title: "Test Phase6 Task",
      teamId: team._id,
      createdBy: user._id,
      status: "TODO",
    });

    await AccessGrant.create({
      userId: user._id,
      teamId: team._id,
      permissionId: perm1._id,
      permissionKey: perm1.key,
      resource: task._id.toString(),
      grantedBy: user._id,
      status: "ACTIVE",
    });

    const bootstrap = await getWorkspaceBootstrap({
      teamId: team._id,
      userId: user._id,
      actor: user,
    });

    assert.equal(bootstrap.team.name, team.name);
    assert.ok(bootstrap.permissions.includes(perm1.key));
    assert.equal(bootstrap.membership.status, "ACTIVE");
    assert.equal(bootstrap.membership.roles.length, 1);
    assert.equal(bootstrap.activeGrants.length, 1);
    assert.equal(bootstrap.stats.memberCount, 1);
    assert.equal(bootstrap.stats.activeTaskCount, 1);
  });

  test("2. getWorkspaceBootstrap for Super Admin provides wildcard access without membership", async () => {
    const superAdmin = await User.create({
      name: "Phase6 SuperAdmin",
      email: `superadmin-${Date.now()}@test-phase6.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const foreignTeam = await Team.create({
      name: `Test Phase6 Foreign Team ${Date.now()}`,
      createdBy: superAdmin._id,
      status: "ACTIVE",
    });

    const bootstrap = await getWorkspaceBootstrap({
      teamId: foreignTeam._id,
      userId: superAdmin._id,
      actor: superAdmin,
    });

    assert.equal(bootstrap.isSuperAdmin, true);
    assert.ok(bootstrap.permissions.includes("*"));
  });
});
