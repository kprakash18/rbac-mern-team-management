import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Permission from "../permissions/permission.model.js";
import AccessRequest from "./access-request.model.js";
import AccessGrant from "./access-grant.model.js";
import { can } from "../authorization/authorization.service.js";
import {
  createAccessRequest,
  getAccessRequestsByTeam,
  updateAccessRequest,
  deleteAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
  revokeAccessGrant,
} from "./access.service.js";

async function runAccessTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 6 Access Requests & Grants Test Suite");
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
    console.log(" Connected to database for Access Request verification.\n");

    // 1. Fixtures
    const adminUser = await User.findOne({ email: "admin@system.local" });
    const aliceUser = await User.findOne({ email: "alice@example.com" }); // Team Admin in Eng
    const bobUser = await User.findOne({ email: "bob@example.com" });     // Developer in Eng
    const charlieUser = await User.findOne({ email: "charlie@example.com" }); // Viewer in Eng
    const engTeam = await Team.findOne({ name: "Engineering Core" });

    // Clean up test requests/grants from previous runs
    await AccessRequest.deleteMany({ reason: { $regex: /^\[TEST\]/ } });
    await AccessGrant.deleteMany({ resource: "task:test-resource-100" });

    // --- Test 1: Submit Access Request ---
    console.log("--- 1. Request Submission & Duplicate Prevention ---");
    const testReq = await createAccessRequest({
      requesterId: charlieUser._id,
      targetUserId: charlieUser._id,
      teamId: engTeam._id,
      permissionKey: "task.delete",
      resource: "task:test-resource-100",
      reason: "[TEST] Need to delete corrupted test task",
      durationHours: 2,
    });

    assert(testReq && testReq.status === "PENDING", "Creates access request in PENDING state");
    assert(testReq.expiresAt !== null, "Sets requested expiration TTL");

    // --- Test 2: Prevent Duplicate Pending Requests ---
    let duplicateError = null;
    try {
      await createAccessRequest({
        requesterId: charlieUser._id,
        targetUserId: charlieUser._id,
        teamId: engTeam._id,
        permissionKey: "task.delete",
        resource: "task:test-resource-100",
        reason: "[TEST] Duplicate request",
      });
    } catch (err) {
      duplicateError = err;
    }
    assert(duplicateError !== null && duplicateError.name === "ConflictError", "Rejects duplicate pending request with ConflictError");

    // --- Test 3: Requester Self-Correction (PATCH) ---
    console.log("\n--- 2. Requester Self-Correction ---");
    const updatedReq = await updateAccessRequest({
      teamId: engTeam._id,
      requestId: testReq._id,
      requesterId: charlieUser._id,
      updates: {
        reason: "[TEST] Updated justification reason",
        durationHours: 4,
      },
    });
    assert(updatedReq.reason === "[TEST] Updated justification reason", "Requester successfully updates reason");

    // --- Test 4: Unauthorized Edit Rejection ---
    let unauthEditError = null;
    try {
      await updateAccessRequest({
        teamId: engTeam._id,
        requestId: testReq._id,
        requesterId: bobUser._id, // Bob tries to edit Charlie's request
        updates: { reason: "[TEST] Malicious edit" },
      });
    } catch (err) {
      unauthEditError = err;
    }
    assert(unauthEditError !== null && unauthEditError.name === "ForbiddenError", "Rejects non-owner attempting to edit request");

    // --- Test 5: Anti-Self-Approval Invariant ---
    console.log("\n--- 3. Separation of Duties (Anti-Self-Approval) ---");
    let selfApprovalError = null;
    try {
      await approveAccessRequest({
        teamId: engTeam._id,
        requestId: testReq._id,
        reviewerId: charlieUser._id, // Charlie tries to approve his own request
      });
    } catch (err) {
      selfApprovalError = err;
    }
    assert(selfApprovalError !== null && selfApprovalError.name === "ForbiddenError", "Self-approval is strictly rejected with ForbiddenError");

    // --- Test 6: Reviewer Approval & Atomic Grant Creation ---
    console.log("\n--- 4. Approval & Atomic Grant Issuance ---");
    const approvalResult = await approveAccessRequest({
      teamId: engTeam._id,
      requestId: testReq._id,
      reviewerId: aliceUser._id, // Alice (Admin) approves
    });

    assert(approvalResult.request.status === "APPROVED", "Transitions request status to APPROVED");
    assert(approvalResult.grant && approvalResult.grant.status === "ACTIVE", "Atomically issues active AccessGrant");
    assert(approvalResult.grant.accessRequestId.toString() === testReq._id.toString(), "Grant is linked to accessRequestId for audit history");

    // --- Test 7: Live Decision Engine Verification (can) ---
    console.log("\n--- 5. Live Authorization Decision Evaluation ---");
    const isAllowedNow = await can(charlieUser._id, engTeam._id, "task.delete", "task:test-resource-100");
    assert(isAllowedNow === true, "Charlie is immediately GRANTED task.delete on test resource via live grant");

    const isDeniedOtherResource = await can(charlieUser._id, engTeam._id, "task.delete", "task:other-task");
    assert(isDeniedOtherResource === false, "Grant is strictly resource-scoped (denied on other tasks)");

    // --- Test 8: Double Decision Prevention ---
    let doubleDecisionError = null;
    try {
      await approveAccessRequest({
        teamId: engTeam._id,
        requestId: testReq._id,
        reviewerId: aliceUser._id,
      });
    } catch (err) {
      doubleDecisionError = err;
    }
    assert(doubleDecisionError !== null && doubleDecisionError.name === "ConflictError", "Rejects approving an already-approved request");

    // --- Test 9: Rejection Workflow ---
    console.log("\n--- 6. Rejection Workflow ---");
    const rejectReq = await createAccessRequest({
      requesterId: bobUser._id,
      targetUserId: bobUser._id,
      teamId: engTeam._id,
      permissionKey: "team.delete",
      resource: "*",
      reason: "[TEST] Need team delete",
    });

    const rejectedResult = await rejectAccessRequest({
      teamId: engTeam._id,
      requestId: rejectReq._id,
      reviewerId: aliceUser._id,
      reason: "Dangerous operation denied",
    });
    assert(rejectedResult.status === "REJECTED", "Transitions request status to REJECTED");

    // --- Test 10: Requester Withdrawal / Deletion ---
    console.log("\n--- 7. Requester Withdrawal (DELETE) ---");
    const cancelReq = await createAccessRequest({
      requesterId: bobUser._id,
      targetUserId: bobUser._id,
      teamId: engTeam._id,
      permissionKey: "task.create",
      resource: "*",
      reason: "[TEST] Accidental request",
    });

    const deleteResult = await deleteAccessRequest({
      teamId: engTeam._id,
      requestId: cancelReq._id,
      requesterId: bobUser._id,
    });
    assert(deleteResult.success === true, "Original requester successfully deletes pending request");

    // Clean up
    await AccessRequest.deleteMany({ reason: { $regex: /^\[TEST\]/ } });
    await AccessGrant.deleteMany({ resource: "task:test-resource-100" });

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

runAccessTests();
