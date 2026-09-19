import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import app from "../../src/app.js";
import { connectDatabase, disconnectDatabase } from "../../src/database/connection.js";
import { env } from "../../src/config/env.js";
import { hashPassword } from "../../src/common/security/password.js";
import { hashToken } from "../../src/modules/invitations/invitations.utils.js";
import User from "../../src/modules/users/user.model.js";
import Team from "../../src/modules/teams/team.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Membership from "../../src/modules/memberships/membership.model.js";
import MembershipRole from "../../src/modules/member-roles/member-role.model.js";
import Invitation from "../../src/modules/invitations/invitation.model.js";
import Task from "../../src/modules/tasks/task.model.js";
import AuditLog from "../../src/modules/audit/audit-log.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";

const TEST_DOMAIN = "test-feature-flow.local";
const PASSWORD = "Password123!";

let server;
let baseUrl;

function listen(appInstance) {
  return new Promise((resolve, reject) => {
    const instance = http.createServer(appInstance);
    instance.once("error", reject);
    instance.listen(0, () => resolve(instance));
  });
}

async function request(path, { method = "GET", token, body, expectedStatus = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${path} expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(payload)}`
  );

  return payload;
}

async function login(email) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  assert.ok(payload.data?.accessToken, "login should return an access token");
  return payload.data;
}

async function cleanup() {
  const users = await User.find({ email: new RegExp(`@${TEST_DOMAIN.replace(".", "\\.")}$`) }).select("_id");
  const userIds = users.map((user) => user._id);
  const teams = await Team.find({ name: /^Feature Flow / }).select("_id");
  const teamIds = teams.map((team) => team._id);
  const roles = await Role.find({ name: /^Feature Flow / }).select("_id");
  const roleIds = roles.map((role) => role._id);
  const memberships = await Membership.find({
    $or: [{ userId: { $in: userIds } }, { teamId: { $in: teamIds } }],
  }).select("_id");
  const membershipIds = memberships.map((membership) => membership._id);

  await Promise.all([
    MembershipRole.deleteMany({ $or: [{ membershipId: { $in: membershipIds } }, { roleId: { $in: roleIds } }] }),
    Membership.deleteMany({ _id: { $in: membershipIds } }),
    Invitation.deleteMany({ $or: [{ email: new RegExp(`@${TEST_DOMAIN.replace(".", "\\.")}$`) }, { teamId: { $in: teamIds } }] }),
    Task.deleteMany({ teamId: { $in: teamIds } }),
    AuditLog.deleteMany({ $or: [{ actorId: { $in: userIds } }, { teamId: { $in: teamIds } }] }),
    Notification.deleteMany({ $or: [{ recipientId: { $in: userIds } }, { teamId: { $in: teamIds } }] }),
    Team.deleteMany({ _id: { $in: teamIds } }),
    Role.deleteMany({ _id: { $in: roleIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);
}

test.before(async () => {
  await connectDatabase(env.mongoUri);
  await cleanup();
  server = await listen(app);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await cleanup();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await disconnectDatabase();
});

test.describe("Feature E2E — workspace invitation and task flow", () => {
  test("admin invites a member, assigns limited access, and task permissions are enforced through HTTP", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const adminEmail = `admin-${suffix}@${TEST_DOMAIN}`;
    const memberEmail = `member-${suffix}@${TEST_DOMAIN}`;

    const [admin, member] = await Promise.all([
      User.create({
        name: "Feature Flow Admin",
        email: adminEmail,
        hashedPassword: await hashPassword(PASSWORD),
        accountStatus: "ACTIVE",
        isSuperAdmin: true,
      }),
      User.create({
        name: "Feature Flow Member",
        email: memberEmail,
        hashedPassword: await hashPassword(PASSWORD),
        accountStatus: "ACTIVE",
        isSuperAdmin: false,
      }),
    ]);
    const limitedRole = await Role.create({
      name: `Feature Flow Limited Member ${suffix}`,
      description: "Can read tasks and update assigned task status only.",
      permissions: ["team.read", "task.read"],
      status: "ACTIVE",
      isSystemRole: false,
      createdBy: admin._id,
    });

    const { accessToken: adminToken } = await login(adminEmail);

    const createdTeam = await request("/api/teams", {
      method: "POST",
      token: adminToken,
      expectedStatus: 201,
      body: {
        name: `Feature Flow Team ${suffix}`,
        description: "Backend E2E feature test workspace.",
      },
    });
    const teamId = createdTeam.data._id;
    assert.ok(mongoose.Types.ObjectId.isValid(teamId), "team creation should return a valid id");

    const invitation = await request(`/api/teams/${teamId}/invitations`, {
      method: "POST",
      token: adminToken,
      expectedStatus: 201,
      body: {
        email: memberEmail,
        roleIds: [limitedRole._id.toString()],
      },
    });
    assert.equal(invitation.data.isDirectAssignment, true);
    assert.equal(invitation.data.email, memberEmail);
    assert.equal(invitation.data.token, undefined, "invitation response must not expose raw tokens");
    assert.equal(invitation.data.inviteLink, undefined, "invitation response must not expose invite links");

    const { accessToken: memberToken, user: memberLoginUser } = await login(memberEmail);
    assert.equal(memberLoginUser.email, memberEmail);

    const memberBootstrap = await request(`/api/teams/${teamId}/bootstrap`, {
      token: memberToken,
    });
    assert.equal(memberBootstrap.data.team.id, teamId);
    assert.deepEqual(memberBootstrap.data.permissions.sort(), ["task.read", "team.read"].sort());

    const forbiddenTaskCreate = await request(`/api/teams/${teamId}/tasks`, {
      method: "POST",
      token: memberToken,
      expectedStatus: 403,
      body: {
        title: "Member should not create this task",
      },
    });
    assert.equal(forbiddenTaskCreate.success, false);

    const createdTask = await request(`/api/teams/${teamId}/tasks`, {
      method: "POST",
      token: adminToken,
      expectedStatus: 201,
      body: {
        title: "Feature Flow Assigned Task",
        description: "Created by admin and assigned to limited member.",
        assignedTo: member._id.toString(),
        priority: "HIGH",
      },
    });
    const taskId = createdTask.data._id;
    assert.equal(createdTask.data.assignedTo, member._id.toString());

    const memberTaskList = await request(`/api/teams/${teamId}/tasks`, {
      token: memberToken,
    });
    assert.equal(memberTaskList.data.length, 1);
    assert.equal(memberTaskList.data[0]._id, taskId);

    const statusUpdate = await request(`/api/teams/${teamId}/tasks/${taskId}`, {
      method: "PATCH",
      token: memberToken,
      body: {
        status: "IN_PROGRESS",
        remarks: "Started working on this.",
      },
    });
    assert.equal(statusUpdate.data.status, "IN_PROGRESS");
    assert.equal(statusUpdate.data.remarks, "Started working on this.");

    const forbiddenTitleUpdate = await request(`/api/teams/${teamId}/tasks/${taskId}`, {
      method: "PATCH",
      token: memberToken,
      expectedStatus: 403,
      body: {
        title: "Limited member should not rename tasks",
      },
    });
    assert.equal(forbiddenTitleUpdate.success, false);

    const rawToken = `feature-flow-token-${suffix}`;
    await Invitation.create({
      email: `new-member-${suffix}@${TEST_DOMAIN}`,
      teamId,
      invitedBy: admin._id,
      roleIds: [limitedRole._id],
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      status: "PENDING",
    });

    const acceptedInvite = await request(`/api/invitations/accept/${rawToken}`, {
      method: "POST",
      body: {
        name: "Feature Flow New Member",
        password: PASSWORD,
      },
    });
    assert.ok(acceptedInvite.data.token, "accepted invitation should return a token");
    assert.equal(acceptedInvite.data.team.id, teamId);
  });
});
