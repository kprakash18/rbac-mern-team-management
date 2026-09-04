import Permission from "../../modules/permissions/permission.model.js";
import Role from "../../modules/roles/role.model.js";
import RolePermission from "../../modules/roles/role-permission.model.js";
import User from "../../modules/users/user.model.js";
import Team from "../../modules/teams/team.model.js";
import Membership from "../../modules/memberships/membership.model.js";
import MembershipRole from "../../modules/member-roles/member-role.model.js";
import Task from "../../modules/tasks/task.model.js";

import Invitation from "../../modules/invitations/invitation.model.js";
import AccessRequest from "../../modules/access/access-request.model.js";
import AccessGrant from "../../modules/access/access-grant.model.js";
import Notification from "../../modules/notifications/notification.model.js";
import AuditLog from "../../modules/audit/audit-log.model.js";

import { permissionSeedData } from "./data/permissions.data.js";
import { systemRolesData } from "./data/roles.data.js";
import { systemAdminUserData, demoUsersData } from "./data/users.data.js";
import { teamsData } from "./data/teams.data.js";
import { tasksData } from "./data/tasks.data.js";
import { scenariosData } from "./data/scenarios.data.js";

import { hashPassword, DEFAULT_PASSWORD } from "./helpers/password.js";
import { generateInvitationToken } from "./helpers/token.js";
import { seedContext } from "./helpers/references.js";
import { clearAllCollections } from "./helpers/clear.js";
import { printSeedSummary } from "./helpers/summary.js";
import { validateSeed } from "./validators/validateSeed.js";

/**
 * 1. Seed System Permissions
 */
async function seedPermissions() {
  const operations = permissionSeedData.map((perm) => ({
    updateOne: {
      filter: { key: perm.key.toLowerCase().trim() },
      update: { $set: perm },
      upsert: true,
    },
  }));
  await Permission.bulkWrite(operations);

  const allPermissions = await Permission.find({});
  for (const perm of allPermissions) {
    seedContext.permissions.set(perm.key, perm);
  }
}

/**
 * 2. Seed Users (System Admin & Demo Personas)
 */
async function seedUsers(isSystemOnly = false) {
  const defaultHashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // System Admin (Required bootstrap creator)
  let adminUser = await User.findOne({ email: systemAdminUserData.email });
  if (!adminUser) {
    adminUser = await User.create({
      ...systemAdminUserData,
      hashedPassword: defaultHashedPassword,
    });
  }
  seedContext.users.set(adminUser.email, adminUser);

  if (isSystemOnly) return;

  // Demo Personas
  for (const userData of demoUsersData) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = await User.create({
        ...userData,
        hashedPassword: defaultHashedPassword,
      });
    } else {
      Object.assign(user, userData);
      await user.save();
    }
    seedContext.users.set(user.email, user);
  }
}

/**
 * 3. Seed System Roles & Role-Permission Mappings
 */
async function seedRolesAndPermissions() {
  const systemAdmin = seedContext.users.get("admin@system.local");
  const allPermissions = Array.from(seedContext.permissions.values());
  const permissionMap = seedContext.permissions;
  const rolePermissionOps = [];

  for (const roleDef of systemRolesData) {
    let role = await Role.findOne({ name: roleDef.name });
    if (!role) {
      role = await Role.create({
        name: roleDef.name,
        description: roleDef.description,
        createdBy: systemAdmin._id,
        isSystemRole: roleDef.isSystemRole,
        status: roleDef.status,
      });
    } else {
      role.description = roleDef.description;
      role.isSystemRole = roleDef.isSystemRole;
      role.status = roleDef.status;
      await role.save();
    }
    seedContext.roles.set(role.name, role);

    const targetPermissions =
      roleDef.permissionKeys === "*"
        ? allPermissions
        : roleDef.permissionKeys.map((key) => permissionMap.get(key)).filter(Boolean);

    for (const perm of targetPermissions) {
      rolePermissionOps.push({
        updateOne: {
          filter: { roleId: role._id, permissionId: perm._id },
          update: {
            $set: {
              roleId: role._id,
              permissionId: perm._id,
              assignedBy: systemAdmin._id,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (rolePermissionOps.length > 0) {
    await RolePermission.bulkWrite(rolePermissionOps);
  }
}

/**
 * 4. Seed Teams
 */
async function seedTeams() {
  for (const teamItem of teamsData) {
    const creator = seedContext.users.get(teamItem.creatorEmail);
    let team = await Team.findOne({ name: teamItem.name });
    if (!team) {
      team = await Team.create({
        name: teamItem.name,
        description: teamItem.description,
        createdBy: creator._id,
        status: teamItem.status,
      });
    } else {
      team.description = teamItem.description;
      team.status = teamItem.status;
      await team.save();
    }
    seedContext.teams.set(team.name, team);
  }
}

/**
 * 5. Seed Memberships & Membership Roles
 */
async function seedMembershipsAndRoles() {
  // Memberships
  for (const item of scenariosData.memberships) {
    const user = seedContext.users.get(item.userEmail);
    const team = seedContext.teams.get(item.teamName);

    let membership = await Membership.findOne({ userId: user._id, teamId: team._id });
    if (!membership) {
      membership = await Membership.create({
        userId: user._id,
        teamId: team._id,
        status: item.status || "ACTIVE",
        joinedAt: new Date(),
      });
    } else {
      membership.status = item.status || "ACTIVE";
      await membership.save();
    }
    seedContext.memberships.set(`${item.userEmail}:${item.teamName}`, membership);
  }

  // Membership Roles
  for (const item of scenariosData.membershipRoles) {
    const membership = seedContext.memberships.get(`${item.userEmail}:${item.teamName}`);
    const role = seedContext.roles.get(item.roleName);
    const assigner = seedContext.users.get(item.assignedByEmail);

    let memRole = await MembershipRole.findOne({
      membershipId: membership._id,
      roleId: role._id,
    });
    if (!memRole) {
      await MembershipRole.create({
        membershipId: membership._id,
        roleId: role._id,
        assignedBy: assigner._id,
        assignedAt: new Date(),
        expiresAt: item.expiresAt || null,
      });
    } else {
      memRole.assignedBy = assigner._id;
      memRole.expiresAt = item.expiresAt || null;
      await memRole.save();
    }
  }
}

/**
 * 6. Seed Tasks
 */
async function seedTasks() {
  for (const item of tasksData) {
    const team = seedContext.teams.get(item.teamName);
    const creator = seedContext.users.get(item.creatorEmail);
    const assignee = item.assigneeEmail ? seedContext.users.get(item.assigneeEmail) : null;

    let task = await Task.findOne({ title: item.title, teamId: team._id });
    if (!task) {
      task = await Task.create({
        title: item.title,
        description: item.description,
        teamId: team._id,
        createdBy: creator._id,
        assignedTo: assignee ? assignee._id : null,
        status: item.status || "TODO",
        priority: item.priority || "MEDIUM",
        dueDate: item.dueDate || null,
      });
    } else {
      Object.assign(task, {
        description: item.description,
        createdBy: creator._id,
        assignedTo: assignee ? assignee._id : null,
        status: item.status || "TODO",
        priority: item.priority || "MEDIUM",
        dueDate: item.dueDate || null,
      });
      await task.save();
    }
    seedContext.tasks.set(item.key, task);
  }
}

/**
 * 7. Seed Invitations
 */
async function seedInvitations() {
  const now = Date.now();
  for (const item of scenariosData.invitations) {
    const team = seedContext.teams.get(item.teamName);
    const inviter = seedContext.users.get(item.invitedByEmail);
    const existingUser = seedContext.users.get(item.email);

    const { rawToken, tokenHash } = generateInvitationToken();
    seedContext.rawInvitationTokens.set(item.email, rawToken);

    const expiresAt = new Date(now + item.expiresInDays * 24 * 60 * 60 * 1000);
    const acceptedAt = item.acceptedDaysAgo ? new Date(now - item.acceptedDaysAgo * 86400000) : null;
    const revokedAt = item.revokedDaysAgo ? new Date(now - item.revokedDaysAgo * 86400000) : null;

    let invitation = await Invitation.findOne({
      email: item.email,
      teamId: team._id,
      status: item.status,
    });

    if (!invitation) {
      invitation = await Invitation.create({
        email: item.email,
        userId: existingUser ? existingUser._id : null,
        teamId: team._id,
        invitedBy: inviter._id,
        status: item.status,
        tokenHash,
        expiresAt,
        acceptedAt,
        revokedAt,
      });
    } else {
      Object.assign(invitation, { tokenHash, expiresAt, acceptedAt, revokedAt });
      await invitation.save();
    }
    seedContext.invitations.set(`${item.email}:${item.teamName}`, invitation);
  }
}

/**
 * 8. Seed Access Requests & Grants
 */
async function seedAccessRequestsAndGrants() {
  const now = Date.now();

  // Access Requests
  for (const item of scenariosData.accessRequests) {
    const requester = seedContext.users.get(item.requesterEmail);
    const targetUser = seedContext.users.get(item.targetUserEmail);
    const team = seedContext.teams.get(item.teamName);
    const permission = seedContext.permissions.get(item.permissionKey);
    const resource = item.taskKey ? `task:${seedContext.tasks.get(item.taskKey)._id}` : item.resource;

    const reviewer = item.reviewedByEmail ? seedContext.users.get(item.reviewedByEmail) : null;
    const reviewedAt = item.reviewedDaysAgo ? new Date(now - item.reviewedDaysAgo * 86400000) : new Date();

    let req = await AccessRequest.findOne({
      requesterId: requester._id,
      teamId: team._id,
      permissionId: permission._id,
      resource,
      status: item.status,
    });

    if (!req) {
      req = await AccessRequest.create({
        requesterId: requester._id,
        targetUserId: targetUser._id,
        teamId: team._id,
        resource,
        permissionId: permission._id,
        reason: item.reason,
        status: item.status,
        reviewedBy: reviewer ? reviewer._id : null,
        reviewedAt: reviewer ? reviewedAt : null,
      });
    }
    seedContext.accessRequests.set(item.key, req);
  }

  // Access Grants
  for (const item of scenariosData.accessGrants) {
    const user = seedContext.users.get(item.userEmail);
    const team = seedContext.teams.get(item.teamName);
    const permission = seedContext.permissions.get(item.permissionKey);
    const granter = seedContext.users.get(item.grantedByEmail);
    const resource = item.taskKey ? `task:${seedContext.tasks.get(item.taskKey)._id}` : item.resource;

    const accessRequestId = item.requestKey ? seedContext.accessRequests.get(item.requestKey)?._id : null;
    const expiresAt = item.expiresInDays ? new Date(now + item.expiresInDays * 86400000) : null;
    const revokedAt = item.revokedDaysAgo ? new Date(now - item.revokedDaysAgo * 86400000) : null;
    const revokedBy = item.revokedByEmail ? seedContext.users.get(item.revokedByEmail)?._id : null;

    let grant = await AccessGrant.findOne({
      userId: user._id,
      teamId: team._id,
      permissionId: permission._id,
      resource,
      status: item.status,
    });

    if (!grant) {
      await AccessGrant.create({
        userId: user._id,
        teamId: team._id,
        permissionId: permission._id,
        resource,
        grantedBy: granter._id,
        source: item.source || "MANUAL",
        accessRequestId,
        status: item.status || "ACTIVE",
        expiresAt,
        revokedAt,
        revokedBy,
      });
    } else {
      Object.assign(grant, { status: item.status, expiresAt, revokedAt, revokedBy });
      await grant.save();
    }
  }
}

/**
 * 9. Seed Notifications & Audit Logs
 */
async function seedNotificationsAndAuditLogs() {
  // Notifications
  for (const item of scenariosData.notifications) {
    const recipient = seedContext.users.get(item.recipientEmail);
    const team = item.teamName ? seedContext.teams.get(item.teamName) : null;
    let resource = item.resource || null;
    if (item.resourceKey) {
      const taskDoc = seedContext.tasks.get(item.resourceKey);
      resource = taskDoc ? `task:${taskDoc._id}` : item.resourceKey;
    }

    await Notification.create({
      recipientId: recipient._id,
      type: item.type,
      title: item.title,
      message: item.message,
      teamId: team ? team._id : null,
      resource,
      readAt: item.isRead ? new Date() : null,
    });
  }

  // Audit Logs
  for (const item of scenariosData.auditLogs) {
    const actor = seedContext.users.get(item.actorEmail);
    const team = item.teamName ? seedContext.teams.get(item.teamName) : null;
    let targetId = null;
    if (item.targetUserEmail) targetId = seedContext.users.get(item.targetUserEmail)?._id;
    else if (item.targetTeamName) targetId = seedContext.teams.get(item.targetTeamName)?._id;

    const metadata = { ...item.metadata };
    if (item.taskKey) {
      const taskDoc = seedContext.tasks.get(item.taskKey);
      if (taskDoc) {
        metadata.taskId = taskDoc._id.toString();
        metadata.resource = `task:${taskDoc._id}`;
      }
    }

    await AuditLog.create({
      actorId: actor ? actor._id : null,
      action: item.action,
      targetType: item.targetType,
      targetId,
      teamId: team ? team._id : null,
      metadata,
      result: item.result || "SUCCESS",
      ipAddress: item.ipAddress || "127.0.0.1",
      userAgent: item.userAgent || "Mozilla/5.0 (Seed-Runner/1.0)",
    });
  }
}

/**
 * Global Seeder Function
 * Orchestrates the complete seeding lifecycle in strict dependency order.
 * @param {{ fresh?: boolean, systemOnly?: boolean }} options
 */
export async function seedDatabase(options = {}) {
  const { fresh = false, systemOnly = false } = options;

  console.log("\n========================================================");
  console.log(`    EXECUTING GLOBAL DATABASE SEEDER ${systemOnly ? "[SYSTEM-ONLY]" : fresh ? "[FRESH RESET]" : "[UPSERT]"}`);
  console.log("========================================================");

  seedContext.reset();

  if (fresh && !systemOnly) {
    await clearAllCollections();
  }

  // Dependency Order Execution
  console.log("→ 1/7 Seeding permissions...");
  await seedPermissions();

  console.log("→ 2/7 Seeding users...");
  await seedUsers(systemOnly);

  console.log("→ 3/7 Seeding roles & role-permission mappings...");
  await seedRolesAndPermissions();

  if (systemOnly) {
    console.log("\n✅ System bootstrap seeding complete.\n");
    return;
  }

  console.log("→ 4/7 Seeding teams & tasks...");
  await seedTeams();
  await seedTasks();

  console.log("→ 5/7 Seeding memberships, roles & invitations...");
  await seedMembershipsAndRoles();
  await seedInvitations();

  console.log("→ 6/7 Seeding access requests & temporary grants...");
  await seedAccessRequestsAndGrants();

  console.log("→ 7/7 Seeding notifications & audit logs...");
  await seedNotificationsAndAuditLogs();

  // Run post-seed validation suite
  await validateSeed();

  // Print summary tables
  await printSeedSummary(seedContext.rawInvitationTokens);

  console.log("✅ Global database seeding completed successfully.\n");
}
