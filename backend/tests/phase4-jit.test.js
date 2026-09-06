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
import MembershipRole from "../src/modules/member-roles/member-role.model.js";
import AccessRequest from "../src/modules/access/access-request.model.js";
import AccessGrant from "../src/modules/access/access-grant.model.js";
import {
  createAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
} from "../src/modules/access/access.service.js";
import { hashPassword } from "../src/common/security/password.js";

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  await User.deleteMany({ email: /@test-phase4\.local$/ });
  await Team.deleteMany({ name: /Test Phase4/ });
  await Role.deleteMany({ name: /Test Phase4/ });
  await Permission.deleteMany({ key: /test\.phase4\./ });
  await Task.deleteMany({ title: /Test Phase4 Task/ });
  await AccessRequest.deleteMany({ reason: /Phase4/ });
  await AccessGrant.deleteMany({ resource: /test-phase4-/ });
  await disconnectDatabase();
});

test.describe("Phase 4 — JIT Engine Hardening & Atomic State Transitions Tests", () => {

  test("1. Concurrent double-approval CAS safety: only 1 approval succeeds, second fails with ConflictError", async () => {
    const admin = await User.create({
      name: "Phase4 Admin",
      email: `admin-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const dev = await User.create({
      name: "Phase4 Dev",
      email: `dev-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const team = await Team.create({
      name: `Test Phase4 Team ${Date.now()}`,
      createdBy: admin._id,
      status: "ACTIVE",
    });

    await Membership.create({
      userId: dev._id,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [],
    });

    const perm = await Permission.create({
      key: `test.phase4.jit_read_${Date.now()}`,
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
      description: "JIT read test perm",
    });

    const accessReq = await AccessRequest.create({
      requesterId: dev._id,
      targetUserId: dev._id,
      teamId: team._id,
      permissionId: perm._id,
      resource: "*",
      reason: "Phase4 concurrent CAS test",
      durationHours: 2,
      status: "PENDING",
      approvalLevel: "TEAM_ADMIN",
    });

    // Execute two concurrent approvals
    const [result1, result2] = await Promise.allSettled([
      approveAccessRequest({ teamId: team._id, requestId: accessReq._id, reviewerId: admin._id }),
      approveAccessRequest({ teamId: team._id, requestId: accessReq._id, reviewerId: admin._id }),
    ]);

    const successes = [result1, result2].filter((r) => r.status === "fulfilled");
    const rejections = [result1, result2].filter((r) => r.status === "rejected");

    assert.equal(successes.length, 1, "Exactly one approval must succeed");
    assert.equal(rejections.length, 1, "The second concurrent approval must be rejected");
    assert.equal(rejections[0].reason.name, "ConflictError", "Rejection error must be ConflictError");
  });

  test("2. Anti-Self-Approval: User cannot approve their own JIT request", async () => {
    const admin = await User.create({
      name: "Phase4 Self Approver",
      email: `self-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const team = await Team.create({
      name: `Test Phase4 Self Team ${Date.now()}`,
      createdBy: admin._id,
      status: "ACTIVE",
    });

    const perm = await Permission.create({
      key: `test.phase4.self_perm_${Date.now()}`,
      resource: "task",
      action: "delete",
      category: "TASK_MANAGEMENT",
      description: "Self approval test perm",
    });

    const accessReq = await AccessRequest.create({
      requesterId: admin._id,
      targetUserId: admin._id,
      teamId: team._id,
      permissionId: perm._id,
      resource: "*",
      reason: "Phase4 self approval test",
      status: "PENDING",
      approvalLevel: "TEAM_ADMIN",
    });

    await assert.rejects(
      async () => {
        await approveAccessRequest({
          teamId: team._id,
          requestId: accessReq._id,
          reviewerId: admin._id, // Self-approval attempt
        });
      },
      {
        name: "ForbiddenError",
        code: "SELF_APPROVAL_FORBIDDEN",
      },
      "Self-approval attempt must throw ForbiddenError"
    );
  });

  test("3. Cross-Tenant Resource Spoofing Prevention: Cannot request access to foreign team's task", async () => {
    const user = await User.create({
      name: "Phase4 Member",
      email: `spoof-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const teamA = await Team.create({
      name: `Test Phase4 Team A ${Date.now()}`,
      createdBy: user._id,
      status: "ACTIVE",
    });

    const teamB = await Team.create({
      name: `Test Phase4 Team B ${Date.now()}`,
      createdBy: user._id,
      status: "ACTIVE",
    });

    await Membership.create({
      userId: user._id,
      teamId: teamA._id,
      status: "ACTIVE",
    });

    // Task created in Team B
    const taskInTeamB = await Task.create({
      title: "Test Phase4 Task in Team B",
      teamId: teamB._id,
      createdBy: user._id,
    });

    const perm = await Permission.create({
      key: `test.phase4.task_edit_${Date.now()}`,
      resource: "task",
      action: "edit",
      category: "TASK_MANAGEMENT",
      description: "Task edit perm",
    });

    // Attempt to request access to Team B's task from Team A context
    await assert.rejects(
      async () => {
        await createAccessRequest({
          requesterId: user._id,
          teamId: teamA._id,
          permissionId: perm._id,
          resource: `task:${taskInTeamB._id}`,
          reason: "Phase4 spoof attempt",
        });
      },
      {
        name: "BadRequestError",
      },
      "Requesting access to foreign team's task must throw BadRequestError"
    );
  });

  test("4. Privilege Clamping: Non-superadmin reviewer cannot approve permissions exceeding their own ceiling", async () => {
    const devUser = await User.create({
      name: "Phase4 Dev Requester",
      email: `dev-req-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const reviewerWithoutPerm = await User.create({
      name: "Phase4 Reviewer Limited",
      email: `reviewer-lim-${Date.now()}@test-phase4.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const team = await Team.create({
      name: `Test Phase4 Clamp Team ${Date.now()}`,
      createdBy: reviewerWithoutPerm._id,
      status: "ACTIVE",
    });

    // Both are active members
    await Membership.create({
      userId: devUser._id,
      teamId: team._id,
      status: "ACTIVE",
    });

    // Reviewer has role with ONLY read perm
    const readPerm = await Permission.create({
      key: `test.phase4.clamp_read_${Date.now()}`,
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
    });

    const deletePerm = await Permission.create({
      key: `test.phase4.clamp_delete_${Date.now()}`,
      resource: "task",
      action: "delete",
      category: "TASK_MANAGEMENT",
    });

    const limitedRole = await Role.create({
      name: `Test Phase4 Limited Role ${Date.now()}`,
      createdBy: reviewerWithoutPerm._id,
      status: "ACTIVE",
      permissions: [readPerm.key], // Only read!
    });

    await Membership.create({
      userId: reviewerWithoutPerm._id,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [limitedRole._id],
    });

    // Dev requested DELETE permission
    const accessReq = await AccessRequest.create({
      requesterId: devUser._id,
      targetUserId: devUser._id,
      teamId: team._id,
      permissionId: deletePerm._id,
      resource: "*",
      reason: "Phase4 clamp test",
      status: "PENDING",
      approvalLevel: "TEAM_ADMIN",
    });

    // Reviewer who only has READ tries to approve DELETE
    await assert.rejects(
      async () => {
        await approveAccessRequest({
          teamId: team._id,
          requestId: accessReq._id,
          reviewerId: reviewerWithoutPerm._id,
        });
      },
      {
        name: "ForbiddenError",
        code: "PRIVILEGE_CLAWBACK_PREVENTED",
      },
      "Approving a grant exceeding approver's ceiling must throw ForbiddenError"
    );
  });
});
