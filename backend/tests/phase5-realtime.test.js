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
import { registerTeamRoomHandlers } from "../src/modules/teams/team.handler.js";
import { hashPassword } from "../src/common/security/password.js";

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  await User.deleteMany({ email: /@test-phase5\.local$/ });
  await Team.deleteMany({ name: /Test Phase5/ });
  await Role.deleteMany({ name: /Test Phase5/ });
  await Permission.deleteMany({ key: /test\.phase5\./ });
  await Task.deleteMany({ title: /Test Phase5/ });
  await AccessGrant.deleteMany({ resource: /test-phase5-/ });
  await disconnectDatabase();
});

test.describe("Phase 5 — Stateless Real-Time Sockets & Room Authorization Tests", () => {

  test("1. team:join allows active member and Super Admin, but rejects non-member with JIT grant", async () => {
    // A. Setup test users
    const superAdmin = await User.create({
      name: "Phase5 Super Admin",
      email: `superadmin-${Date.now()}@test-phase5.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const activeMember = await User.create({
      name: "Phase5 Active Member",
      email: `member-${Date.now()}@test-phase5.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const nonMemberWithJit = await User.create({
      name: "Phase5 Non Member",
      email: `nonmember-${Date.now()}@test-phase5.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const team = await Team.create({
      name: `Test Phase5 Team ${Date.now()}`,
      createdBy: activeMember._id,
      status: "ACTIVE",
    });

    await Membership.create({
      userId: activeMember._id,
      teamId: team._id,
      status: "ACTIVE",
    });

    const perm = await Permission.create({
      key: `test.phase5.perm_${Date.now()}`,
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
    });

    // Create a JIT grant for nonMemberWithJit
    await AccessGrant.create({
      userId: nonMemberWithJit._id,
      teamId: team._id,
      permissionId: perm._id,
      permissionKey: perm.key,
      resource: `test-phase5-task-1`,
      grantedBy: activeMember._id,
      status: "ACTIVE",
    });

    // Mock socket harness
    function createMockSocket(user) {
      const handlers = {};
      const rooms = new Set();
      const emitted = [];

      const socket = {
        data: { user: { id: user._id.toString(), name: user.name, email: user.email, isSuperAdmin: Boolean(user.isSuperAdmin) } },
        on: (event, handler) => {
          handlers[event] = handler;
        },
        join: (room) => {
          rooms.add(room);
        },
        leave: (room) => {
          rooms.delete(room);
        },
        to: () => ({
          emit: (evt, payload) => emitted.push({ evt, payload }),
        }),
        emit: (evt, payload) => emitted.push({ evt, payload }),
      };

      registerTeamRoomHandlers(null, socket);
      return { handlers, rooms, socket };
    }

    // 1. Test Active Member joining team room -> SUCCESS
    const memberHarness = createMockSocket(activeMember);
    let memberResponse = null;
    await memberHarness.handlers["team:join"]({ teamId: team._id.toString() }, (res) => {
      memberResponse = res;
    });
    assert.equal(memberResponse.ok, true, "Active member must successfully join team room");
    assert.ok(memberHarness.rooms.has(`team:${team._id}`), "Active member socket must be in team room");

    // 2. Test Super Admin joining team room -> SUCCESS
    const adminHarness = createMockSocket(superAdmin);
    let adminResponse = null;
    await adminHarness.handlers["team:join"]({ teamId: team._id.toString() }, (res) => {
      adminResponse = res;
    });
    assert.equal(adminResponse.ok, true, "Super Admin must successfully join team room");
    assert.ok(adminHarness.rooms.has(`team:${team._id}`), "Super Admin socket must be in team room");

    // 3. Test Non-Member (even with JIT grant) joining team room -> FORBIDDEN
    const nonMemberHarness = createMockSocket(nonMemberWithJit);
    let nonMemberResponse = null;
    await nonMemberHarness.handlers["team:join"]({ teamId: team._id.toString() }, (res) => {
      nonMemberResponse = res;
    });
    assert.equal(nonMemberResponse.ok, false, "Non-member with JIT grant MUST be rejected from team room");
    assert.ok(!nonMemberHarness.rooms.has(`team:${team._id}`), "Non-member socket must NOT be in team room");
  });

  test("2. task:join allows JIT grant holder into task-specific room", async () => {
    const user = await User.create({
      name: "Phase5 Task JIT User",
      email: `taskjit-${Date.now()}@test-phase5.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const team = await Team.create({
      name: `Test Phase5 Task Team ${Date.now()}`,
      createdBy: user._id,
      status: "ACTIVE",
    });

    await Membership.create({
      userId: user._id,
      teamId: team._id,
      status: "ACTIVE",
    });

    const task = await Task.create({
      title: "Test Phase5 Task Room",
      teamId: team._id,
      createdBy: user._id,
    });

    const perm = await Permission.create({
      key: `test.phase5.task_read_${Date.now()}`,
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
    });

    await AccessGrant.create({
      userId: user._id,
      teamId: team._id,
      permissionId: perm._id,
      permissionKey: "task.read",
      resource: task._id.toString(),
      grantedBy: user._id,
      status: "ACTIVE",
    });

    const handlers = {};
    const rooms = new Set();
    const socket = {
      data: { user: { id: user._id.toString(), name: user.name, email: user.email } },
      on: (evt, h) => { handlers[evt] = h; },
      join: (r) => rooms.add(r),
      leave: (r) => rooms.delete(r),
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };

    registerTeamRoomHandlers(null, socket);

    let taskJoinRes = null;
    await handlers["task:join"]({ taskId: task._id.toString(), teamId: team._id.toString() }, (res) => {
      taskJoinRes = res;
    });

    assert.equal(taskJoinRes.ok, true, "JIT grant holder must be allowed to join task room");
    assert.ok(rooms.has(`task:${task._id}`), "Socket must join task room");
  });
});
