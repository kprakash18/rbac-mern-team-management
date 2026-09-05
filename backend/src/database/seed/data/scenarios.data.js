import { demoUsersData } from "./users.data.js";

// Helper to partition user emails
const activeUsers = demoUsersData.filter((u) => u.accountStatus === "ACTIVE");
const suspendedUsers = demoUsersData.filter((u) => u.accountStatus === "SUSPENDED");
const disabledUsers = demoUsersData.filter((u) => u.accountStatus === "DISABLED");
const invitedUsers = demoUsersData.filter((u) => u.accountStatus === "INVITED");

// 1. Memberships across workspaces
const memberships = [];
const membershipRoles = [];

// Base system workspaces
const workspaceNames = [
  "Engineering Core",
  "Product & Design",
  "DevOps & Cloud Infra",
  "Security & Compliance",
  "Data & AI Platform",
  "Research & AI Lab",
  "Customer Operations",
];

// System Admin memberships
memberships.push({ userEmail: "admin@system.local", teamName: "Security & Compliance", status: "ACTIVE" });
memberships.push({ userEmail: "admin@system.local", teamName: "Engineering Core", status: "ACTIVE" });
membershipRoles.push({
  userEmail: "admin@system.local",
  teamName: "Security & Compliance",
  roleName: "Super Admin",
  assignedByEmail: "admin@system.local",
});
membershipRoles.push({
  userEmail: "admin@system.local",
  teamName: "Engineering Core",
  roleName: "Super Admin",
  assignedByEmail: "admin@system.local",
});

// Explicit Scenario Users:
// Alice: Admin in Engineering Core, Viewer in Research & AI Lab
memberships.push({ userEmail: "alice@example.com", teamName: "Engineering Core", status: "ACTIVE" });
memberships.push({ userEmail: "alice@example.com", teamName: "Research & AI Lab", status: "ACTIVE" });
membershipRoles.push({
  userEmail: "alice@example.com",
  teamName: "Engineering Core",
  roleName: "Team Admin",
  assignedByEmail: "admin@system.local",
});
membershipRoles.push({
  userEmail: "alice@example.com",
  teamName: "Research & AI Lab",
  roleName: "Viewer",
  assignedByEmail: "admin@system.local",
});

// Frank: Suspended in Research & AI Lab, Active with NO roles in Product & Design
memberships.push({ userEmail: "frank@example.com", teamName: "Research & AI Lab", status: "SUSPENDED" });
memberships.push({ userEmail: "frank@example.com", teamName: "Product & Design", status: "ACTIVE" });

// Hannah: Active in Engineering Core with NO roles (revoked role scenario)
memberships.push({ userEmail: "hannah@example.com", teamName: "Engineering Core", status: "ACTIVE" });

// Special scenario handled emails to avoid automatic loop collisions
const specialHandledEmails = new Set(["alice@example.com", "frank@example.com", "hannah@example.com"]);

// Distribute remaining active users across workspaces
activeUsers
  .filter((u) => !specialHandledEmails.has(u.email))
  .forEach((user, index) => {
    const primaryWs = workspaceNames[index % workspaceNames.length];
    memberships.push({ userEmail: user.email, teamName: primaryWs, status: "ACTIVE" });

    const roleName =
      index < 5
        ? "Team Admin"
        : index % 4 === 0
        ? "Team Admin"
        : index % 3 === 0
        ? "Viewer"
        : index % 5 === 0
        ? "Security Auditor"
        : "Developer";

    membershipRoles.push({
      userEmail: user.email,
      teamName: primaryWs,
      roleName,
      assignedByEmail: "admin@system.local",
    });

    // Secondary workspace for cross-functional members
    if (index % 2 === 0) {
      const secondaryWs = workspaceNames[(index + 1) % workspaceNames.length];
      memberships.push({ userEmail: user.email, teamName: secondaryWs, status: "ACTIVE" });
      membershipRoles.push({
        userEmail: user.email,
        teamName: secondaryWs,
        roleName: "Viewer",
        assignedByEmail: "alice@example.com",
      });
    }
  });

// Suspended users memberships
suspendedUsers.forEach((user, index) => {
  const ws = workspaceNames[index % workspaceNames.length];
  memberships.push({ userEmail: user.email, teamName: ws, status: "SUSPENDED" });
  membershipRoles.push({
    userEmail: user.email,
    teamName: ws,
    roleName: "Developer",
    assignedByEmail: "admin@system.local",
  });
});

// Invitations (Pending, Accepted, Revoked, Expired)
const invitations = [
  // Grace Hopper scenario: Pending invitation to Engineering Core
  {
    email: "grace@example.com",
    teamName: "Engineering Core",
    invitedByEmail: "alice@example.com",
    status: "PENDING",
    expiresInDays: 7,
  },
  // Distribute other invited users
  ...invitedUsers
    .filter((u) => u.email !== "grace@example.com")
    .map((u, i) => ({
      email: u.email,
      teamName: workspaceNames[i % workspaceNames.length],
      invitedByEmail: "alice@example.com",
      status: "PENDING",
      expiresInDays: 7,
    })),
  {
    email: "david@example.com",
    teamName: "Engineering Core",
    invitedByEmail: "alice@example.com",
    status: "ACCEPTED",
    expiresInDays: 7,
    acceptedDaysAgo: 10,
  },
  {
    email: "sarah.connor@external.org",
    teamName: "Security & Compliance",
    invitedByEmail: "admin@system.local",
    status: "REVOKED",
    expiresInDays: 7,
    revokedDaysAgo: 3,
  },
  {
    email: "kyle.reese@contractor.net",
    teamName: "DevOps & Cloud Infra",
    invitedByEmail: "victor.stone@company.com",
    status: "EXPIRED",
    expiresInDays: -2,
  },
];

// JIT Access Requests
const accessRequests = [
  {
    key: "req-david",
    requesterEmail: "david@example.com",
    targetUserEmail: "david@example.com",
    teamName: "Engineering Core",
    permissionKey: "task.delete",
    taskKey: "eng-task-1",
    reason: "Emergency database schema cleanup and task purge.",
    status: "PENDING",
    requestedHoursAgo: 1,
  },
  {
    key: "req-charlie",
    requesterEmail: "charlie@example.com",
    targetUserEmail: "charlie@example.com",
    teamName: "Engineering Core",
    permissionKey: "membership.create",
    resource: "team:eng-core",
    reason: "Onboarding contractor engineer to sprint backlog.",
    status: "PENDING",
    requestedHoursAgo: 2,
  },
  {
    key: "req-elena",
    requesterEmail: "elena.rostova@company.com",
    targetUserEmail: "elena.rostova@company.com",
    teamName: "Engineering Core",
    permissionKey: "role.assign",
    resource: "team:eng-core",
    reason: "Promoting backend senior engineer to temporary sprint lead.",
    status: "APPROVED",
    reviewedByEmail: "alice@example.com",
    requestedHoursAgo: 5,
    reviewedHoursAgo: 4,
  },
  {
    key: "req-elliot",
    requesterEmail: "elliot.alderson@company.com",
    targetUserEmail: "elliot.alderson@company.com",
    teamName: "DevOps & Cloud Infra",
    permissionKey: "team.update",
    resource: "team:cloud-infra",
    reason: "Deploying Kubernetes v1.30 patch to primary node pools.",
    status: "APPROVED",
    reviewedByEmail: "victor.stone@company.com",
    requestedHoursAgo: 8,
    reviewedHoursAgo: 7,
  },
  {
    key: "req-fox",
    requesterEmail: "fox.mulder@company.com",
    targetUserEmail: "fox.mulder@company.com",
    teamName: "Security & Compliance",
    permissionKey: "audit.read",
    resource: "team:sec-comp",
    reason: "SOC2 Type II quarterly audit verification.",
    status: "REJECTED",
    reviewedByEmail: "admin@system.local",
    requestedHoursAgo: 24,
    reviewedHoursAgo: 22,
    rejectionReason: "Formal ticket approval from CISO is required first.",
  },
];

// Active & Expired Access Grants (TTL-Bounded)
const accessGrants = [
  // Charlie scenario: Active grant on real Task ObjectId
  {
    key: "grant-charlie",
    userEmail: "charlie@example.com",
    teamName: "Engineering Core",
    permissionKey: "task.update",
    taskKey: "eng-task-1",
    grantedByEmail: "alice@example.com",
    status: "ACTIVE",
    expiresInDays: 7,
  },
  {
    key: "grant-elena",
    userEmail: "elena.rostova@company.com",
    teamName: "Engineering Core",
    permissionKey: "role.assign",
    resource: "team:eng-core",
    grantedByEmail: "alice@example.com",
    status: "ACTIVE",
    expiresInDays: 1,
  },
  {
    key: "grant-elliot",
    userEmail: "elliot.alderson@company.com",
    teamName: "DevOps & Cloud Infra",
    permissionKey: "team.update",
    resource: "team:cloud-infra",
    grantedByEmail: "victor.stone@company.com",
    status: "ACTIVE",
    expiresInDays: 2,
  },
  // Ian scenario: Expired grant in the past
  {
    key: "grant-ian",
    userEmail: "ian@example.com",
    teamName: "Engineering Core",
    permissionKey: "task.delete",
    resource: "team:eng-core",
    grantedByEmail: "alice@example.com",
    status: "EXPIRED",
    expiresInDays: -2,
  },
];

// Notifications
const notifications = [
  // Hannah scenario: Notification for role revocation
  {
    recipientEmail: "hannah@example.com",
    type: "ROLE_REVOKED",
    title: "Role Revoked",
    message: "Your role assignment has been revoked in Engineering Core.",
    teamName: "Engineering Core",
    isRead: false,
  },
  {
    recipientEmail: "alice@example.com",
    type: "ROLE_ASSIGNED",
    title: "Role Updated",
    message: "You have been assigned the Team Admin role in Engineering Core.",
    teamName: "Engineering Core",
    isRead: true,
  },
  {
    recipientEmail: "bob@example.com",
    type: "INVITATION",
    title: "Team Invitation",
    message: "You were added to the Product & Design team.",
    teamName: "Product & Design",
    isRead: true,
  },
  {
    recipientEmail: "david@example.com",
    type: "ROLE_ASSIGNED",
    title: "New Role Assigned",
    message: "You were assigned Developer role in Engineering Core.",
    teamName: "Engineering Core",
    isRead: false,
  },
  {
    recipientEmail: "eva@example.com",
    type: "ACCESS_GRANTED",
    title: "JIT Elevated Access Granted",
    message: "Your emergency write grant for tasks:write has been approved.",
    teamName: "Security & Compliance",
    isRead: false,
  },
  {
    recipientEmail: "admin@system.local",
    type: "ACCESS_REQUEST",
    title: "Access Request Pending",
    message: "Eva Harrison requested temporary elevation for tasks:write.",
    teamName: "Security & Compliance",
    isRead: true,
  },
  {
    recipientEmail: "admin@system.local",
    type: "SYSTEM",
    title: "Security Telemetry Alert",
    message: "Automated vulnerability scan completed across all active workspaces.",
    teamName: "Security & Compliance",
    isRead: false,
  },
  {
    recipientEmail: "pam.beesly@company.com",
    type: "ROLE_ASSIGNED",
    title: "Welcome to Product & Design",
    message: "Your workspace profile has been configured.",
    teamName: "Product & Design",
    isRead: true,
  },
  {
    recipientEmail: "elliot.alderson@company.com",
    type: "ROLE_ASSIGNED",
    title: "DevOps Workspace Access",
    message: "You have been granted Developer access in DevOps & Cloud Infra.",
    teamName: "DevOps & Cloud Infra",
    isRead: false,
  },
];

// Audit Logs (Historical Telemetry & Scenario Events)
const auditLogs = [
  // Hannah scenario: ROLE_REVOKED audit log
  {
    actorEmail: "admin@system.local",
    action: "ROLE_REVOKED",
    targetType: "User",
    targetUserEmail: "hannah@example.com",
    teamName: "Engineering Core",
    result: "SUCCESS",
    ipAddress: "192.168.1.10",
    minutesAgo: 300,
  },
  {
    actorEmail: "admin@system.local",
    action: "auth.login.success",
    targetType: "User",
    teamName: "Security & Compliance",
    result: "SUCCESS",
    ipAddress: "192.168.1.10",
    minutesAgo: 5,
  },
  {
    actorEmail: "alice@example.com",
    action: "user.invited",
    targetType: "Invitation",
    teamName: "Engineering Core",
    result: "SUCCESS",
    ipAddress: "10.0.4.15",
    minutesAgo: 12,
  },
  {
    actorEmail: "unknown@attacker.net",
    action: "auth.login.failure",
    targetType: "User",
    teamName: "Security & Compliance",
    result: "FAILURE",
    ipAddress: "185.220.101.5",
    minutesAgo: 25,
  },
  {
    actorEmail: "victor.stone@company.com",
    action: "team.config.updated",
    targetType: "Team",
    teamName: "DevOps & Cloud Infra",
    result: "SUCCESS",
    ipAddress: "10.0.12.8",
    minutesAgo: 40,
  },
  {
    actorEmail: "alice@example.com",
    action: "access_grant.activated",
    targetType: "AccessGrant",
    teamName: "Engineering Core",
    result: "SUCCESS",
    ipAddress: "10.0.4.15",
    minutesAgo: 55,
  },
  {
    actorEmail: "admin@system.local",
    action: "role.permissions.updated",
    targetType: "Role",
    teamName: "Security & Compliance",
    result: "SUCCESS",
    ipAddress: "192.168.1.10",
    minutesAgo: 70,
  },
  {
    actorEmail: "bob@example.com",
    action: "task.created",
    targetType: "Task",
    teamName: "Product & Design",
    result: "SUCCESS",
    ipAddress: "10.0.2.22",
    minutesAgo: 95,
  },
  {
    actorEmail: "alan.turing@company.com",
    action: "dataset.exported",
    targetType: "Team",
    teamName: "Data & AI Platform",
    result: "SUCCESS",
    ipAddress: "10.0.8.44",
    minutesAgo: 120,
  },
  {
    actorEmail: "unknown@194.26.29.11",
    action: "auth.brute_force.blocked",
    targetType: "User",
    teamName: "Security & Compliance",
    result: "FAILURE",
    ipAddress: "194.26.29.11",
    minutesAgo: 150,
  },
  {
    actorEmail: "admin@system.local",
    action: "membership.suspended",
    targetType: "Membership",
    teamName: "Engineering Core",
    result: "SUCCESS",
    ipAddress: "192.168.1.10",
    minutesAgo: 180,
  },
];

// Generate 60+ additional audit logs for telemetry analytics
for (let i = 1; i <= 60; i++) {
  const isFail = i % 12 === 0;
  auditLogs.push({
    actorEmail: i % 2 === 0 ? "alice@example.com" : "bob@example.com",
    action: i % 5 === 0 ? "role.assigned" : i % 3 === 0 ? "task.status_changed" : "auth.login.success",
    targetType: "Team",
    teamName: workspaceNames[i % workspaceNames.length],
    result: isFail ? "FAILURE" : "SUCCESS",
    ipAddress: `10.0.${(i % 10) + 1}.${(i % 250) + 1}`,
    minutesAgo: 200 + i * 35,
  });
}

export const scenariosData = {
  memberships,
  membershipRoles,
  invitations,
  accessRequests,
  accessGrants,
  notifications,
  auditLogs,
};
