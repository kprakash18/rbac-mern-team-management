import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Task from "../tasks/task.model.js";
import { can, resolvePermissions } from "./authorization.service.js";

describe("Phase 3: Dynamic Authorization Test Suite", () => {
  let alice, bob, charlie, frank, hannah, ian;
  let engTeam, researchTeam, productTeam, task1, task2, task3;

  before(async () => {
    await mongoose.connect(env.mongoUri);
    [alice, bob, charlie, frank, hannah, ian] = await Promise.all([
      User.findOne({ email: "alice@example.com" }),
      User.findOne({ email: "bob@example.com" }),
      User.findOne({ email: "charlie@example.com" }),
      User.findOne({ email: "frank@example.com" }),
      User.findOne({ email: "hannah@example.com" }),
      User.findOne({ email: "ian@example.com" }),
    ]);
    [engTeam, researchTeam, productTeam] = await Promise.all([
      Team.findOne({ name: "Engineering Core" }),
      Team.findOne({ name: "Research & AI Lab" }),
      Team.findOne({ name: "Product & Design" }),
    ]);
    [task1, task2, task3] = await Promise.all([
      Task.findOne({ title: "Implement Realtime Socket.IO Auth Middleware" }),
      Task.findOne({ title: "Database Schema Index Optimization & Migration" }),
      Task.findOne({ title: "Security Audit Logging Pipeline Integration" }),
    ]);
  });

  after(async () => mongoose.disconnect());

  it("enforces cross-team role isolation (Alice: Admin in Eng, Viewer in Research)", async () => {
    assert.strictEqual(await can(alice._id, engTeam._id, "team.update"), true);
    assert.strictEqual(await can(alice._id, engTeam._id, "task.delete"), true);
    assert.strictEqual(await can(alice._id, researchTeam._id, "team.update"), false);
    assert.strictEqual(await can(alice._id, researchTeam._id, "task.read"), true);
  });

  it("enforces role boundaries (Bob: Admin in Product, Dev in Eng)", async () => {
    assert.strictEqual(await can(bob._id, productTeam._id, "role.assign"), true);
    assert.strictEqual(await can(bob._id, engTeam._id, "role.assign"), false);
    assert.strictEqual(await can(bob._id, engTeam._id, "task.create"), true);
  });

  it("evaluates scoped direct access grants (Charlie)", async () => {
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.read"), true);
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.update", task1._id), true);
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.update", task2._id), false);
    assert.strictEqual(await can(charlie._id, engTeam._id, "task.delete", task1._id), false);
  });

  it("denies access for suspended or roleless members (Frank)", async () => {
    assert.strictEqual(await can(frank._id, researchTeam._id, "task.read"), false);
    assert.strictEqual((await resolvePermissions(frank._id, researchTeam._id)).length, 0);
    assert.strictEqual(await can(frank._id, productTeam._id, "task.create"), false);
    assert.strictEqual((await resolvePermissions(frank._id, productTeam._id)).length, 0);
  });

  it("denies expired direct grants (Ian) and revoked roles (Hannah)", async () => {
    assert.strictEqual(await can(ian._id, engTeam._id, "task.read"), true);
    assert.strictEqual(await can(ian._id, engTeam._id, "task.create", task3?._id), false);
    assert.strictEqual(await can(hannah._id, engTeam._id, "task.create"), false);
  });

  it("resolves and deduplicates permissions", async () => {
    const perms = await resolvePermissions(alice._id, engTeam._id);
    assert.ok(perms.includes("task.create") && perms.includes("team.update"));
    assert.strictEqual(perms.length, new Set(perms).size);
  });
});
