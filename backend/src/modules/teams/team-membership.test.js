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

async function runTeamMembershipTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 5 Teams & Memberships Test Suite");
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

  let createdTestTeam = null;

  try {
    await mongoose.connect(env.mongoUri);
    console.log(" Connected to database for Team/Membership verification.\n");

    // Load fixtures
    const adminUser = await User.findOne({ email: "admin@system.local" });
    const alice = await User.findOne({ email: "alice@example.com" });
    const grace = await User.findOne({ email: "grace@example.com" });
    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const devRole = await Role.findOne({ name: "Developer", isSystemRole: true });

    // Clean up test team from previous runs if any
    const existingTestTeam = await Team.findOne({ name: "Mobile Platform" });
    if (existingTestTeam) {
      await Membership.deleteMany({ teamId: existingTestTeam._id });
      await Team.deleteOne({ _id: existingTestTeam._id });
    }

    // --- 1. Team Creation & Creator Auto-Membership ---
    console.log("--- 1. Team Creation & Creator Auto-Membership ---");
    createdTestTeam = await teamService.createTeam({
      name: "Mobile Platform",
      description: "Mobile apps and SDK engineering",
      createdBy: adminUser._id,
    });
    assert(createdTestTeam && createdTestTeam.status === "ACTIVE", "Team created with status: ACTIVE");

    const creatorMembership = await Membership.findOne({
      userId: adminUser._id,
      teamId: createdTestTeam._id,
    });
    assert(creatorMembership && creatorMembership.status === "ACTIVE", "Creator automatically onboarded as active team member");

    // --- 2. Duplicate Team Name Prevention ---
    console.log("\n--- 2. Duplicate Team Name Prevention ---");
    let duplicateTeamBlocked = false;
    try {
      await teamService.createTeam({
        name: "Mobile Platform",
        description: "Duplicate attempt",
        createdBy: adminUser._id,
      });
    } catch (err) {
      duplicateTeamBlocked = err.statusCode === 409;
    }
    assert(duplicateTeamBlocked, "Duplicate active team creation rejected with 409 Conflict");

    // --- 3. Team Metadata Update & Soft Archival ---
    console.log("\n--- 3. Team Metadata Update & Soft Archival ---");
    const updatedTeam = await teamService.updateTeam(createdTestTeam._id, {
      description: "Updated mobile description",
    });
    assert(updatedTeam.description === "Updated mobile description", "Team description updated successfully");

    await teamService.archiveTeam(createdTestTeam._id);
    let archivedLookupBlocked = false;
    try {
      await teamService.getTeamById(createdTestTeam._id);
    } catch (err) {
      archivedLookupBlocked = err.statusCode === 404;
    }
    assert(archivedLookupBlocked, "Archived team lookup rejected with 404 Not Found");

    // --- 4. User Discovery & Safe Projection ---
    console.log("\n--- 4. User Discovery & Safe Projection ---");
    const userSearch = await userService.searchUsers({ query: "Grace" });
    assert(userSearch.users.length > 0, "User search returns matching user results");
    assert(userSearch.users[0].hashedPassword === undefined, "User discovery never leaks hashedPassword");

    // --- 5. Member Onboarding & Duplicate Prevention ---
    console.log("\n--- 5. Member Onboarding & Duplicate Prevention ---");
    // Clean up Grace's membership in Engineering Core if any from prior run
    await Membership.deleteMany({ userId: grace._id, teamId: engTeam._id });

    const graceMembership = await membershipService.addMemberToTeam({
      teamId: engTeam._id,
      userId: grace._id,
      addedBy: alice._id,
    });
    assert(graceMembership && graceMembership.status === "ACTIVE", "Grace added to Engineering Core with status: ACTIVE");

    let duplicateMemberBlocked = false;
    try {
      await membershipService.addMemberToTeam({
        teamId: engTeam._id,
        userId: grace._id,
        addedBy: alice._id,
      });
    } catch (err) {
      duplicateMemberBlocked = err.statusCode === 409;
    }
    assert(duplicateMemberBlocked, "Duplicate team membership rejected with 409 Conflict");

    // --- 6. Membership Suspension & Authorization Invalidation ---
    console.log("\n--- 6. Membership Suspension & Authorization Invalidation ---");
    // Assign developer role to Grace
    await MembershipRole.deleteMany({ membershipId: graceMembership._id });
    await MembershipRole.create({
      membershipId: graceMembership._id,
      roleId: devRole._id,
      assignedBy: alice._id,
    });

    const canBeforeSuspend = await can(grace._id, engTeam._id, "task.create");
    assert(canBeforeSuspend === true, "Grace has 'task.create' when membership is ACTIVE");

    await membershipService.suspendMembership({
      teamId: engTeam._id,
      membershipId: graceMembership._id,
      actorId: alice._id,
    });

    const canAfterSuspend = await can(grace._id, engTeam._id, "task.create");
    assert(canAfterSuspend === false, "Grace is immediately DENIED access when membership is SUSPENDED");

    // --- 7. Membership Reactivation & Access Restoration ---
    console.log("\n--- 7. Membership Reactivation & Access Restoration ---");
    await membershipService.reactivateMembership({
      teamId: engTeam._id,
      membershipId: graceMembership._id,
      actorId: alice._id,
    });

    const canAfterReactivate = await can(grace._id, engTeam._id, "task.create");
    assert(canAfterReactivate === true, "Grace access restored when membership is REACTIVATED");

    // --- 8. Member Removal & Cascading Role Revocation ---
    console.log("\n--- 8. Member Removal & Cascading Role Revocation ---");
    await membershipService.removeMemberFromTeam({
      teamId: engTeam._id,
      membershipId: graceMembership._id,
      actorId: alice._id,
    });

    const canAfterRemoval = await can(grace._id, engTeam._id, "task.create");
    assert(canAfterRemoval === false, "Grace is permanently DENIED access after removal");

    const revokedRoles = await MembershipRole.find({
      membershipId: graceMembership._id,
      revokedAt: { $ne: null },
    });
    assert(revokedRoles.length > 0, "Active roles cascaded to soft-revoked upon member removal");

    // --- 9. Re-Joining Member Lifecycle Transition ---
    console.log("\n--- 9. Re-Joining Member Lifecycle Transition ---");
    const rejoinedMembership = await membershipService.addMemberToTeam({
      teamId: engTeam._id,
      userId: grace._id,
      addedBy: alice._id,
    });
    assert(rejoinedMembership && rejoinedMembership.status === "ACTIVE", "Previously removed member successfully re-joins as ACTIVE");

    // --- 10. Paginated Team Member Listing ---
    console.log("\n--- 10. Paginated Team Member Listing ---");
    const memberListing = await membershipService.listTeamMembers({
      teamId: engTeam._id,
      page: 1,
      limit: 5,
    });
    assert(memberListing.members.length > 0 && memberListing.total > 0, "Team members listed with pagination metadata");

    // Cleanup test artifacts
    if (createdTestTeam) {
      await Membership.deleteMany({ teamId: createdTestTeam._id });
      await Team.deleteOne({ _id: createdTestTeam._id });
    }
    await MembershipRole.deleteMany({ membershipId: graceMembership._id });
    await Membership.deleteMany({ userId: grace._id, teamId: engTeam._id });

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

runTeamMembershipTests();
