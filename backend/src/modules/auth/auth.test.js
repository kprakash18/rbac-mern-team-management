import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import { login, getCurrentUser, changePassword } from "./auth.service.js";
import { signAccessToken, verifyAccessToken } from "../../common/security/jwt.js";
import { hashPassword } from "../../common/security/password.js";

describe("Phase 2: Authentication Test Suite", () => {
  let aliceId, graceId;

  before(async () => {
    await mongoose.connect(env.mongoUri);
    const defaultHashed = await hashPassword("Password123!");
    await User.deleteMany({ email: { $in: ["suspended@example.com", "disabled@example.com"] } });
    await User.updateOne({ email: "grace@example.com" }, { accountStatus: "INVITED", mustChangePassword: true, hashedPassword: defaultHashed });
    await User.create([
      { name: "Suspended Test", email: "suspended@example.com", hashedPassword: defaultHashed, accountStatus: "SUSPENDED" },
      { name: "Disabled Test", email: "disabled@example.com", hashedPassword: defaultHashed, accountStatus: "DISABLED" },
    ]);
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ["suspended@example.com", "disabled@example.com"] } });
    await mongoose.disconnect();
  });

  describe("POST /auth/login", () => {
    it("authenticates active user and omits password hash", async () => {
      const res = await login({ email: "alice@example.com", password: "Password123!" });
      assert.ok(res.accessToken && res.user.hashedPassword === undefined && !res.requiresPasswordChange);
      aliceId = res.user.id;
    });

    it("rejects invalid password (401)", async () => {
      await assert.rejects(() => login({ email: "alice@example.com", password: "Wrong!" }), { statusCode: 401 });
    });

    it("rejects non-existent email (401)", async () => {
      await assert.rejects(() => login({ email: "ghost@example.com", password: "Password123!" }), { statusCode: 401 });
    });

    it("rejects invalid payload (400)", async () => {
      await assert.rejects(() => login({ email: "invalid-email", password: "Password123!" }), { statusCode: 400 });
      await assert.rejects(() => login({ email: "alice@example.com", password: "" }), { statusCode: 400 });
    });

    it("rejects suspended/disabled accounts (403)", async () => {
      await assert.rejects(() => login({ email: "suspended@example.com", password: "Password123!" }), { statusCode: 403, code: "ACCOUNT_SUSPENDED" });
      await assert.rejects(() => login({ email: "disabled@example.com", password: "Password123!" }), { statusCode: 403, code: "ACCOUNT_DISABLED" });
    });

    it("returns requiresPasswordChange for invited users", async () => {
      const res = await login({ email: "grace@example.com", password: "Password123!" });
      assert.ok(res.accessToken && res.requiresPasswordChange);
      graceId = res.user.id;
    });
  });

  describe("JWT & Profile", () => {
    it("signs and verifies tokens correctly", () => {
      const token = signAccessToken({ sub: aliceId });
      assert.strictEqual(verifyAccessToken(token).sub, aliceId.toString());
      assert.throws(() => verifyAccessToken(token + "tampered"));
      const expired = signAccessToken({ sub: aliceId }, { expiresIn: "-1s" });
      assert.throws(() => verifyAccessToken(expired), { name: "TokenExpiredError" });
    });

    it("returns sanitized profile via getCurrentUser", async () => {
      const profile = await getCurrentUser(aliceId);
      assert.ok(profile.email === "alice@example.com" && profile.hashedPassword === undefined);
    });
  });

  describe("POST /auth/change-password", () => {
    it("rejects invalid current password (400)", async () => {
      await assert.rejects(() => changePassword(graceId, { currentPassword: "Wrong!", newPassword: "NewSecurePassword123!" }), { statusCode: 400 });
    });

    it("rotates password and transitions status to ACTIVE", async () => {
      const res = await changePassword(graceId, { currentPassword: "Password123!", newPassword: "NewSecurePassword123!" });
      assert.ok(res.user.accountStatus === "ACTIVE" && !res.user.mustChangePassword);

      await assert.rejects(() => login({ email: "grace@example.com", password: "Password123!" }), { statusCode: 401 });
      const newLogin = await login({ email: "grace@example.com", password: "NewSecurePassword123!" });
      assert.ok(newLogin.accessToken && !newLogin.requiresPasswordChange);
    });
  });

  describe("Identity Boundary Isolation", () => {
    it("authenticates users regardless of team-level role state", async () => {
      const hannah = await login({ email: "hannah@example.com", password: "Password123!" });
      const frank = await login({ email: "frank@example.com", password: "Password123!" });
      assert.ok(hannah.accessToken && frank.accessToken);
    });
  });
});
