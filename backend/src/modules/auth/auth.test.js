import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import { login, getCurrentUser, changePassword } from "./auth.service.js";
import { signAccessToken, verifyAccessToken } from "../../common/security/jwt.js";
import { comparePassword, hashPassword } from "../../common/security/password.js";
import { seedDatabase } from "../../database/seed/seeder.js";

async function runAuthTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 2 Authentication Test Suite");
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
    // 1. Connect to Database & Reset test users
    await mongoose.connect(env.mongoUri);
    console.log("🌱 Resetting auth test fixtures...");
    const defaultHashed = await hashPassword("Password123!");
    await User.deleteMany({ email: { $in: ["suspended@example.com", "disabled@example.com"] } });
    await User.updateOne(
      { email: "grace@example.com" },
      { accountStatus: "INVITED", mustChangePassword: true, hashedPassword: defaultHashed }
    );
    console.log("✅ Database ready for testing.\n");

    // ==========================================================
    // 1. LOGIN TESTS
    // ==========================================================
    console.log("--- 1. Login Tests ---");

    // Alice (Active Admin)
    const aliceRes = await login({ email: "alice@example.com", password: "Password123!" });
    assert(aliceRes.accessToken && aliceRes.user.email === "alice@example.com", "Alice can login with valid credentials");
    assert(!aliceRes.user.hashedPassword, "Alice user object does NOT leak hashedPassword");
    assert(aliceRes.requiresPasswordChange === false, "Alice requiresPasswordChange is false");

    // Bob (Active Manager)
    const bobRes = await login({ email: "bob@example.com", password: "Password123!" });
    assert(bobRes.accessToken && bobRes.user.name === "Bob Stone", "Bob can login with valid credentials");

    // Invalid password
    let invalidPassThrew = false;
    try {
      await login({ email: "alice@example.com", password: "WrongPassword!" });
    } catch (err) {
      invalidPassThrew = err.statusCode === 401;
    }
    assert(invalidPassThrew, "Invalid password rejected with 401 Unauthorized");

    // Unknown email
    let unknownEmailThrew = false;
    try {
      await login({ email: "nonexistent@example.com", password: "Password123!" });
    } catch (err) {
      unknownEmailThrew = err.statusCode === 401;
    }
    assert(unknownEmailThrew, "Unknown email rejected with 401 Unauthorized");

    // Malformed email
    let malformedEmailThrew = false;
    try {
      await login({ email: "not-an-email", password: "Password123!" });
    } catch (err) {
      malformedEmailThrew = err.statusCode === 400;
    }
    assert(malformedEmailThrew, "Malformed email rejected with 400 Bad Request");

    // Missing password
    let missingCredsThrew = false;
    try {
      await login({ email: "alice@example.com", password: "" });
    } catch (err) {
      missingCredsThrew = err.statusCode === 400;
    }
    assert(missingCredsThrew, "Missing password rejected with 400 Bad Request");

    // Setup suspended & disabled test users
    const hashedPass = await hashPassword("Password123!");
    await User.create({
      name: "Suspended Test User",
      email: "suspended@example.com",
      hashedPassword: hashedPass,
      accountStatus: "SUSPENDED",
    });
    await User.create({
      name: "Disabled Test User",
      email: "disabled@example.com",
      hashedPassword: hashedPass,
      accountStatus: "DISABLED",
    });

    // Suspended User
    let suspendedThrew = false;
    try {
      await login({ email: "suspended@example.com", password: "Password123!" });
    } catch (err) {
      suspendedThrew = err.statusCode === 403 && err.code === "ACCOUNT_SUSPENDED";
    }
    assert(suspendedThrew, "Suspended user rejected with 403 Forbidden (ACCOUNT_SUSPENDED)");

    // Disabled User
    let disabledThrew = false;
    try {
      await login({ email: "disabled@example.com", password: "Password123!" });
    } catch (err) {
      disabledThrew = err.statusCode === 403 && err.code === "ACCOUNT_DISABLED";
    }
    assert(disabledThrew, "Disabled user rejected with 403 Forbidden (ACCOUNT_DISABLED)");

    // Invited User (Grace)
    const graceRes = await login({ email: "grace@example.com", password: "Password123!" });
    assert(graceRes.accessToken && graceRes.requiresPasswordChange === true, "Invited user (Grace) can login and has requiresPasswordChange: true");

    // ==========================================================
    // 2. JWT VERIFICATION TESTS
    // ==========================================================
    console.log("\n--- 2. JWT Verification Tests ---");

    const validToken = signAccessToken({ sub: aliceRes.user.id });
    const decoded = verifyAccessToken(validToken);
    assert(decoded.sub === aliceRes.user.id.toString(), "Valid JWT verified and sub claim extracted");

    let invalidSigThrew = false;
    try {
      verifyAccessToken(validToken + "tampered");
    } catch (err) {
      invalidSigThrew = true;
    }
    assert(invalidSigThrew, "Tampered JWT signature rejected");

    let expiredThrew = false;
    try {
      const expiredToken = signAccessToken({ sub: aliceRes.user.id }, { expiresIn: "-1s" });
      verifyAccessToken(expiredToken);
    } catch (err) {
      expiredThrew = err.name === "TokenExpiredError";
    }
    assert(expiredThrew, "Expired JWT rejected with TokenExpiredError");

    // ==========================================================
    // 3. CURRENT USER (GET /api/auth/me) TESTS
    // ==========================================================
    console.log("\n--- 3. Current User Tests ---");

    const meProfile = await getCurrentUser(aliceRes.user.id);
    assert(meProfile.email === "alice@example.com", "getCurrentUser returns correct profile");
    assert(meProfile.hashedPassword === undefined, "getCurrentUser never includes hashedPassword");

    // ==========================================================
    // 4. PASSWORD CHANGE LIFECYCLE TESTS
    // ==========================================================
    console.log("\n--- 4. Password Change Lifecycle Tests ---");

    // Incorrect current password rejected
    let wrongCurrentPassThrew = false;
    try {
      await changePassword(graceRes.user.id, {
        currentPassword: "WrongCurrentPassword123!",
        newPassword: "BrandNewSecurePassword123!",
      });
    } catch (err) {
      wrongCurrentPassThrew = err.statusCode === 400;
    }
    assert(wrongCurrentPassThrew, "Incorrect current password rejected with 400 Bad Request");

    // Grace changes password successfully
    const changeRes = await changePassword(graceRes.user.id, {
      currentPassword: "Password123!",
      newPassword: "BrandNewSecurePassword123!",
    });
    assert(changeRes.user.mustChangePassword === false, "Grace mustChangePassword updated to false");
    assert(changeRes.user.accountStatus === "ACTIVE", "Grace accountStatus transitioned from INVITED to ACTIVE");

    // Old password no longer works
    let oldPassFailed = false;
    try {
      await login({ email: "grace@example.com", password: "Password123!" });
    } catch (err) {
      oldPassFailed = err.statusCode === 401;
    }
    assert(oldPassFailed, "Grace old temporary password no longer works");

    // New password works
    const graceNewLogin = await login({ email: "grace@example.com", password: "BrandNewSecurePassword123!" });
    assert(graceNewLogin.accessToken && graceNewLogin.requiresPasswordChange === false, "Grace logs in successfully with new password");

    // ==========================================================
    // 5. IDENTITY VS AUTHORIZATION SEPARATION TESTS
    // ==========================================================
    console.log("\n--- 5. Identity vs Authorization Separation ---");

    // Hannah (Active user account, 0 team memberships)
    const hannahRes = await login({ email: "hannah@example.com", password: "Password123!" });
    assert(hannahRes.accessToken && hannahRes.user.email === "hannah@example.com", "Hannah (0 team roles) can authenticate at identity layer");

    // Frank (Active user account, suspended in Research team)
    const frankRes = await login({ email: "frank@example.com", password: "Password123!" });
    assert(frankRes.accessToken && frankRes.user.email === "frank@example.com", "Frank (active user account) can authenticate at identity layer");

    // Summary
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

runAuthTests();
