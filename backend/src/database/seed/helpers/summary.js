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
import { DEFAULT_PASSWORD } from "./password.js";

const MONITORED_COLLECTIONS = [
  { name: "Permissions", model: Permission },
  { name: "Roles", model: Role },
  { name: "RolePermissions", model: RolePermission },
  { name: "Users", model: User },
  { name: "Teams", model: Team },
  { name: "Memberships", model: Membership },
  { name: "MembershipRoles", model: MembershipRole },
  { name: "Tasks", model: Task },
  { name: "Invitations", model: Invitation },
  { name: "AccessRequests", model: AccessRequest },
  { name: "AccessGrants", model: AccessGrant },
  { name: "Notifications", model: Notification },
  { name: "AuditLogs", model: AuditLog },
];

const DEMO_PERSONAS_SUMMARY = [
  {
    Persona: "System Admin",
    Email: "admin@system.local",
    Status: "ACTIVE",
    KeyScenario: "Global Platform Super Admin",
  },
  {
    Persona: "Alice",
    Email: "alice@example.com",
    Status: "ACTIVE",
    KeyScenario: "Eng: Team Admin | Research: Viewer",
  },
  {
    Persona: "Bob",
    Email: "bob@example.com",
    Status: "ACTIVE",
    KeyScenario: "Product: Team Admin | Eng: Developer",
  },
  {
    Persona: "Charlie",
    Email: "charlie@example.com",
    Status: "ACTIVE",
    KeyScenario: "Eng: Viewer + Active Temp Grant (task.update)",
  },
  {
    Persona: "David",
    Email: "david@example.com",
    Status: "ACTIVE",
    KeyScenario: "Eng: Developer + Pending Access Request (task.delete)",
  },
  {
    Persona: "Eva",
    Email: "eva@example.com",
    Status: "ACTIVE",
    KeyScenario: "Security: Auditor | Research: Viewer + Direct Grant",
  },
  {
    Persona: "Frank",
    Email: "frank@example.com",
    Status: "ACTIVE",
    KeyScenario: "Research: SUSPENDED | Product: ACTIVE (No Role)",
  },
  {
    Persona: "Grace",
    Email: "grace@example.com",
    Status: "INVITED",
    KeyScenario: "MustChangePassword=true + Pending Invitation",
  },
  {
    Persona: "Hannah",
    Email: "hannah@example.com",
    Status: "ACTIVE",
    KeyScenario: "Eng: Member (Role Revoked + Audit Trail)",
  },
  {
    Persona: "Ian",
    Email: "ian@example.com",
    Status: "ACTIVE",
    KeyScenario: "Eng: Viewer + EXPIRED Temporary Grant",
  },
];

/**
 * Print a detailed database summary with document counts and test credentials.
 */
export async function printSeedSummary(rawInvitationTokens = new Map()) {
  const counts = await Promise.all(
    MONITORED_COLLECTIONS.map(async ({ name, model }) => ({
      Collection: name,
      Count: await model.countDocuments(),
    }))
  );

  console.log("\n========================================================");
  console.log("             DATABASE SEED SUMMARY");
  console.log("========================================================");
  console.table(counts);

  console.log("\n========================================================");
  console.log("            DEMO PERSONAS & TEST CREDENTIALS");
  console.log("========================================================");
  console.log(`Default Password: ${DEFAULT_PASSWORD}\n`);

  console.table(DEMO_PERSONAS_SUMMARY);

  if (rawInvitationTokens.size > 0) {
    console.log("\n--- Development-Only Raw Invitation Tokens (Not persisted in DB) ---");
    for (const [email, token] of rawInvitationTokens.entries()) {
      console.log(`- ${email}: ${token}`);
    }
  }

  console.log("========================================================\n");
}
