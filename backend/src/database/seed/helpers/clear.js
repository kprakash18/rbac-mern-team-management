import Permission from "../../../modules/permissions/permission.model.js";
import Role from "../../../modules/roles/role.model.js";
import RolePermission from "../../../modules/roles/role-permission.model.js";
import User from "../../../modules/users/user.model.js";
import Team from "../../../modules/teams/team.model.js";
import Membership from "../../../modules/memberships/membership.model.js";
import MembershipRole from "../../../modules/member-roles/member-role.model.js";
import Task from "../../../modules/tasks/task.model.js";

import Invitation from "../../../modules/invitations/invitation.model.js";
import AccessRequest from "../../../modules/access/access-request.model.js";
import AccessGrant from "../../../modules/access/access-grant.model.js";
import Notification from "../../../modules/notifications/notification.model.js";
import AuditLog from "../../../modules/audit/audit-log.model.js";
import ChatMessage from "../../../modules/chat/chat-message.model.js";

const DEMO_COLLECTION_MODELS = [
  ChatMessage,
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

export async function clearAllCollections() {
  assertNotProduction();
  console.log("Safely clearing all collections in reverse dependency order...");

  await truncateModels(DEMO_COLLECTION_MODELS);
  await truncateModels(SYSTEM_COLLECTION_MODELS);

  console.log("All collections cleared.");
}

export async function clearDevelopmentData() {
  assertNotProduction();
  console.log("Safely clearing development/demo collections...");

  await truncateModels(DEMO_COLLECTION_MODELS);

  const systemRoleIds = await Role.find({ isSystemRole: true }).distinct("_id");
  await RolePermission.deleteMany({ roleId: { $nin: systemRoleIds } });
  await Role.deleteMany({ isSystemRole: { $ne: true } });

  await User.deleteMany({ email: { $ne: "admin@system.local" } });

  console.log("Development collections cleared.");
}
