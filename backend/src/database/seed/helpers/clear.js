import Permission from "../../../modules/permissions/permission.model.js";
import Role from "../../../modules/roles/role.model.js";
import RolePermission from "../../../modules/roles/role-permission.model.js";
import User from "../../../modules/users/user.model.js";
import Team from "../../../modules/teams/team.model.js";
import Membership from "../../../modules/memberships/membership.model.js";
import MembershipRole from "../../../modules/memberships/membership-role.model.js";
import Task from "../../../modules/tasks/task.model.js";
import Invitation from "../../../modules/invitations/invitation.model.js";
import AccessRequest from "../../../modules/access/access-request.model.js";
import AccessGrant from "../../../modules/access/access-grant.model.js";
import Notification from "../../../modules/notifications/notification.model.js";
import AuditLog from "../../../modules/audit/audit-log.model.js";

// Ordered from leaf dependents to root dependencies
const DEMO_COLLECTION_MODELS = [
  AuditLog,
  Notification,
  AccessGrant,
  AccessRequest,
  Invitation,
  Task,
  MembershipRole,
  Membership,
  Team,
];

const SYSTEM_COLLECTION_MODELS = [
  RolePermission,
  Role,
  User,
  Permission,
];

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Destructive database reset is strictly disabled in production environment.");
  }
}

async function truncateModels(models) {
  for (const model of models) {
    await model.deleteMany({});
  }
}

/**
 * Safely clear all application collections in reverse dependency order.
 * Never drops the entire database, and refuses to run in production.
 */
export async function clearAllCollections() {
  assertNotProduction();
  console.log("Safely clearing all collections in reverse dependency order...");

  await truncateModels(DEMO_COLLECTION_MODELS);
  await truncateModels(SYSTEM_COLLECTION_MODELS);

  console.log("All collections cleared.");
}

/**
 * Clear only non-system demo data (preserves permissions, system roles, and system admin user).
 */
export async function clearDevelopmentData() {
  assertNotProduction();
  console.log("Safely clearing development/demo collections...");

  await truncateModels(DEMO_COLLECTION_MODELS);

  // Remove non-system roles & role permissions
  const systemRoleIds = await Role.find({ isSystemRole: true }).distinct("_id");
  await RolePermission.deleteMany({ roleId: { $nin: systemRoleIds } });
  await Role.deleteMany({ isSystemRole: { $ne: true } });

  // Remove demo users except system admin
  await User.deleteMany({ email: { $ne: "admin@system.local" } });

  console.log("Development collections cleared.");
}
