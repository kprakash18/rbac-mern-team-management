import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";
import Task from "./task.model.js";
import {
  createTask,
  getTasksByTeam,
  getTaskById,
  updateTask,
  deleteTask,
} from "./task.service.js";

async function runTaskTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 8 Team Tasks & Authorization Test Suite");
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
    console.log(" Connected to database for Task verification.\n");

    // 1. Fetch Fixtures
    const adminUser = await User.findOne({ email: "admin@system.local" });
    const bobUser = await User.findOne({ email: "bob@example.com" });
    const charlieUser = await User.findOne({ email: "charlie@example.com" });
    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const prodTeam = await Team.findOne({ name: "Product Strategy" });

    // Clean up test tasks
    await Task.deleteMany({ title: { $regex: /^\[TEST\]/ } });

    // --- Test 1: Create Task with Active Assignee ---
    console.log("--- 1. Task Creation & Assignee Validation ---");
    const testTask = await createTask({
      teamId: engTeam._id,
      creatorUserId: adminUser._id,
      title: "[TEST] Build Task Service",
      description: "Implement Phase 8 tasks",
      assignedTo: bobUser._id,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 86400000),
    });

    assert(testTask && testTask.status === "TODO", "Creates task with status TODO");
    assert(testTask.teamId.toString() === engTeam._id.toString(), "Task is bound to target teamId");

    // --- Test 2: Reject Invalid / Non-Member Assignee ---
    let invalidAssigneeError = null;
    try {
      // charlie is not in Product Strategy team
      await createTask({
        teamId: prodTeam._id,
        creatorUserId: adminUser._id,
        title: "[TEST] Invalid Task",
        assignedTo: charlieUser._id,
      });
    } catch (err) {
      invalidAssigneeError = err;
    }
    assert(invalidAssigneeError !== null, "Rejects task creation when assignee is not an active team member");

    // --- Test 3: Multi-Tenant Scoped Listing & Pagination ---
    console.log("\n--- 2. Scoped Listing & Filtering ---");
    const listResult = await getTasksByTeam({
      teamId: engTeam._id,
      query: { status: "TODO", limit: 10 },
    });

    assert(Array.isArray(listResult.tasks), "Returns tasks array");
    assert(listResult.tasks.some((t) => t._id.toString() === testTask._id.toString()), "Includes newly created task");
    assert(listResult.total >= 1, "Provides accurate total count metadata");

    // --- Test 4: Single Retrieval & IDOR Protection ---
    console.log("\n--- 3. Boundary & IDOR Isolation ---");
    const fetchedTask = await getTaskById({ teamId: engTeam._id, taskId: testTask._id });
    assert(fetchedTask._id.toString() === testTask._id.toString(), "Fetches single task by ID and teamId");

    let crossTenantError = null;
    try {
      // Trying to fetch engTeam's task using prodTeam's teamId
      await getTaskById({ teamId: prodTeam._id, taskId: testTask._id });
    } catch (err) {
      crossTenantError = err;
    }
    assert(crossTenantError !== null, "Rejects fetching task across mismatched teamId (IDOR protection)");

    // --- Test 5: Task Mutation & State Transition ---
    console.log("\n--- 4. Task Mutation & Updates ---");
    const updated = await updateTask({
      teamId: engTeam._id,
      taskId: testTask._id,
      updates: {
        status: "IN_PROGRESS",
        priority: "URGENT",
      },
    });
    assert(updated.status === "IN_PROGRESS", "Successfully transitions status to IN_PROGRESS");
    assert(updated.priority === "URGENT", "Successfully updates priority to URGENT");

    // --- Test 6: Deletion ---
    console.log("\n--- 5. Task Deletion ---");
    const deleteResult = await deleteTask({ teamId: engTeam._id, taskId: testTask._id });
    assert(deleteResult.success === true, "Deletes task successfully");

    let fetchDeletedError = null;
    try {
      await getTaskById({ teamId: engTeam._id, taskId: testTask._id });
    } catch (err) {
      fetchDeletedError = err;
    }
    assert(fetchDeletedError !== null, "Deleted task cannot be retrieved (returns 404)");

    // Clean up
    await Task.deleteMany({ title: { $regex: /^\[TEST\]/ } });

  } catch (error) {
    console.error("Test Suite Execution Error:", error);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n==================================================");
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log("==================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTaskTests();
