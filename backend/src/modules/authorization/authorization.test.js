import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Task from "../tasks/task.model.js";
import {
  can,
  resolvePermissions,
  resolveRolePermissions,
  hasValidDirectGrant,
  getMembership,
} from "./authorization.service.js";

async function runAuthorizationTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 3 Dynamic Authorization Test Suite");
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

  try {
    await mongoose.connect(env.mongoUri);
    console.log(" Connected to database for authorization verification.\n");

    // Fetch test entities from seeded database
    const alice = await User.findOne({ email: "alice@example.com" });
    const bob = await User.findOne({ email: "bob@example.com" });
    const charlie = await User.findOne({ email: "charlie@example.com" });
    const frank = await User.findOne({ email: "frank@example.com" });
    const hannah = await User.findOne({ email: "hannah@example.com" });
    const ian = await User.findOne({ email: "ian@example.com" });

    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const researchTeam = await Team.findOne({ name: "Research & AI Lab" });
    const productTeam = await Team.findOne({ name: "Product & Design" });

    const engTask1 = await Task.findOne({ title: "Implement Realtime Socket.IO Auth Middleware" });
    const engTask2 = await Task.findOne({ title: "Database Schema Index Optimization & Migration" });
    const engTask3 = await Task.findOne({ title: "Security Audit Logging Pipeline Integration" });

    // ==========================================================
    // 1. ALICE — CROSS-TEAM ROLE ISOLATION
    // ==========================================================
    console.log("--- 1. Cross-Team Role Isolation (Alice) ---");

    // Alice in Engineering (Team Admin)
    const aliceEngUpdate = await can(alice._id, engTeam._id, "team.update");
    assert(aliceEngUpdate === true, "Alice has 'team.update' in Engineering Core (Team Admin)");

    const aliceEngDeleteTask = await can(alice._id, engTeam._id, "task.delete");
    assert(aliceEngDeleteTask === true, "Alice has 'task.delete' in Engineering Core (Team Admin)");

    // Alice in Research & AI Lab (Viewer)
    const aliceResearchUpdate = await can(alice._id, researchTeam._id, "team.update");
    assert(aliceResearchUpdate === false, "Alice does NOT have 'team.update' in Research & AI Lab (Viewer)");

    const aliceResearchRead = await can(alice._id, researchTeam._id, "task.read");
    assert(aliceResearchRead === true, "Alice has 'task.read' in Research & AI Lab (Viewer)");

    // ==========================================================
    // 2. BOB — ROLE PERMISSION BOUNDARIES
    // ==========================================================
    console.log("\n--- 2. Role Boundaries Across Teams (Bob) ---");

    // Bob in Product (Team Admin)
    const bobProductAssign = await can(bob._id, productTeam._id, "role.assign");
    assert(bobProductAssign === true, "Bob has 'role.assign' in Product & Design (Team Admin)");

    // Bob in Engineering (Developer)
    const bobEngAssign = await can(bob._id, engTeam._id, "role.assign");
    assert(bobEngAssign === false, "Bob does NOT have 'role.assign' in Engineering Core (Developer)");

    const bobEngTaskCreate = await can(bob._id, engTeam._id, "task.create");
    assert(bobEngTaskCreate === true, "Bob has 'task.create' in Engineering Core (Developer)");

    // ==========================================================
    // 3. CHARLIE — RBAC + SCOPED DIRECT ACCESS GRANTS
    // ==========================================================
    console.log("\n--- 3. Scoped Direct Access Grants (Charlie) ---");

    // Charlie base role (Viewer in Engineering)
    const charlieRead = await can(charlie._id, engTeam._id, "task.read");
    assert(charlieRead === true, "Charlie has 'task.read' via Viewer role");

    // Charlie has a direct grant on engTask1 for task.update
    const charlieUpdateTask1 = await can(charlie._id, engTeam._id, "task.update", engTask1._id);
    assert(charlieUpdateTask1 === true, "Charlie has 'task.update' on Task 1 via active Direct Grant");

    // Charlie should NOT have update on Task 2
    const charlieUpdateTask2 = await can(charlie._id, engTeam._id, "task.update", engTask2._id);
    assert(charlieUpdateTask2 === false, "Charlie is DENIED 'task.update' on Task 2 (Grant is resource-scoped)");

    // Charlie should NOT have delete on Task 1
    const charlieDeleteTask1 = await can(charlie._id, engTeam._id, "task.delete", engTask1._id);
    assert(charlieDeleteTask1 === false, "Charlie is DENIED 'task.delete' on Task 1 (Grant only specified update)");

    // ==========================================================
    // 4. FRANK — MEMBERSHIP STATUS & ROLELESS MEMBERS
    // ==========================================================
    console.log("\n--- 4. Membership Status & Roleless Handling (Frank) ---");

    // Frank in Research (Membership is SUSPENDED)
    const frankResearchRead = await can(frank._id, researchTeam._id, "task.read");
    assert(frankResearchRead === false, "Frank is DENIED all actions in Research (Membership is SUSPENDED)");

    const frankResearchPerms = await resolvePermissions(frank._id, researchTeam._id);
    assert(frankResearchPerms.length === 0, "Frank resolves 0 permissions in Research (Suspended membership)");

    // Frank in Product (Membership is ACTIVE, but NO ROLES assigned)
    const frankProductCreate = await can(frank._id, productTeam._id, "task.create");
    assert(frankProductCreate === false, "Frank is DENIED 'task.create' in Product (Active member with no roles)");

    const frankProductPerms = await resolvePermissions(frank._id, productTeam._id);
    assert(frankProductPerms.length === 0, "Frank resolves 0 permissions in Product (Roleless member)");

    // ==========================================================
    // 5. IAN — EXPIRED DIRECT ACCESS GRANTS
    // ==========================================================
    console.log("\n--- 5. Expired Direct Access Grants (Ian) ---");

    // Ian in Engineering (Viewer with expired grant for task.create)
    const ianRead = await can(ian._id, engTeam._id, "task.read");
    assert(ianRead === true, "Ian has 'task.read' via Viewer role");

    const ianCreateTask3 = await can(ian._id, engTeam._id, "task.create", engTask3?._id);
    assert(ianCreateTask3 === false, "Ian is DENIED 'task.create' (Expired direct grant is ignored)");

    // ==========================================================
    // 6. HANNAH — REVOKED ROLE PERMISSIONS
    // ==========================================================
    console.log("\n--- 6. Revoked Role Handling (Hannah) ---");

    // Hannah in Engineering (Active member, but role was revoked / unassigned)
    const hannahCreate = await can(hannah._id, engTeam._id, "task.create");
    assert(hannahCreate === false, "Hannah is DENIED 'task.create' after role revocation");

    // ==========================================================
    // 7. PERMISSION DEDUPLICATION & INTROSPECTION
    // ==========================================================
    console.log("\n--- 7. Permission Resolution & Deduplication ---");

    const aliceEngPermissions = await resolvePermissions(alice._id, engTeam._id);
    assert(Array.isArray(aliceEngPermissions), "resolvePermissions returns an array");
    assert(aliceEngPermissions.includes("task.create"), "Alice permissions include 'task.create'");
    assert(aliceEngPermissions.includes("team.update"), "Alice permissions include 'team.update'");

    // Check no duplicate keys in array
    const hasDuplicates = aliceEngPermissions.length !== new Set(aliceEngPermissions).size;
    assert(!hasDuplicates, "Permission list is strictly deduplicated");

    console.log("\n==================================================");
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test suite encountered an unexpected error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runAuthorizationTests();
