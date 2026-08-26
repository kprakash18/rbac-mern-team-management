import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../memberships/membership-role.model.js";
import Role from "../roles/role.model.js";
import { teamService } from "./team.service.js";
import { membershipService } from "../memberships/membership.service.js";
import { userService } from "../users/user.service.js";
import { can } from "../authorization/authorization.service.js";

describe("Phase 5: Teams & Memberships Test Suite", () => {
  let admin, alice, grace, engTeam, devRole, testTeam, graceMembership;

  before(async () => {
    await mongoose.connect(env.mongoUri);
    [admin, alice, grace, engTeam, devRole] = await Promise.all([
      User.findOne({ email: "admin@system.local" }),
      User.findOne({ email: "alice@example.com" }),
      User.findOne({ email: "grace@example.com" }),
      Team.findOne({ name: "Engineering Core" }),
      Role.findOne({ name: "Developer", isSystemRole: true }),
    ]);

    await Team.deleteMany({ name: "Mobile Platform" });
    await Membership.deleteMany({ userId: grace._id, teamId: engTeam._id });
  });

  after(async () => {
    if (testTeam) await Team.deleteOne({ _id: testTeam._id });
    if (graceMembership) {
      await MembershipRole.deleteMany({ membershipId: graceMembership._id });
      await Membership.deleteMany({ userId: grace._id, teamId: engTeam._id });
    }
    await mongoose.disconnect();
  });

  it("manages team creation, duplicate prevention, and soft archival", async () => {
    testTeam = await teamService.createTeam({ name: "Mobile Platform", createdBy: admin._id });
    assert.ok(testTeam && (await Membership.findOne({ userId: admin._id, teamId: testTeam._id })));

    await assert.rejects(() => teamService.createTeam({ name: "Mobile Platform", createdBy: admin._id }), { statusCode: 409 });

    await teamService.updateTeam(testTeam._id, { description: "Updated" });
    await teamService.archiveTeam(testTeam._id);
    await assert.rejects(() => teamService.getTeamById(testTeam._id), { statusCode: 404 });

    const search = await userService.searchUsers({ query: "Grace" });
    assert.ok(search.users[0].hashedPassword === undefined);
  });

  it("manages membership onboarding, suspension, reactivation, and soft removal", async () => {
    graceMembership = await membershipService.addMemberToTeam({ teamId: engTeam._id, userId: grace._id, addedBy: alice._id });
    await assert.rejects(() => membershipService.addMemberToTeam({ teamId: engTeam._id, userId: grace._id, addedBy: alice._id }), { statusCode: 409 });

    await MembershipRole.create({ membershipId: graceMembership._id, roleId: devRole._id, assignedBy: alice._id });
    assert.strictEqual(await can(grace._id, engTeam._id, "task.create"), true);

    // Suspend -> Reactivate
    await membershipService.suspendMembership({ teamId: engTeam._id, membershipId: graceMembership._id, actorId: alice._id });
    assert.strictEqual(await can(grace._id, engTeam._id, "task.create"), false);
    await membershipService.reactivateMembership({ teamId: engTeam._id, membershipId: graceMembership._id, actorId: alice._id });
    assert.strictEqual(await can(grace._id, engTeam._id, "task.create"), true);

    // Removal cascades to soft-revoke roles
    await membershipService.removeMemberFromTeam({ teamId: engTeam._id, membershipId: graceMembership._id, actorId: alice._id });
    assert.strictEqual(await can(grace._id, engTeam._id, "task.create"), false);
    assert.ok((await MembershipRole.find({ membershipId: graceMembership._id, revokedAt: { $ne: null } })).length > 0);

    // Re-join & pagination
    assert.ok(await membershipService.addMemberToTeam({ teamId: engTeam._id, userId: grace._id, addedBy: alice._id }));
    const listing = await membershipService.listTeamMembers({ teamId: engTeam._id, page: 1, limit: 5 });
    assert.ok(listing.members.length > 0 && listing.total > 0);
  });
});
