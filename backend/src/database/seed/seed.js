import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { connectDatabase, disconnectDatabase } from "../connection.js";
import { getRedisClient } from "../../config/redis.js";
import { hashPassword } from "../../common/security/password.js";

import User from "../../modules/users/user.model.js";
import Team from "../../modules/teams/team.model.js";
import Role from "../../modules/roles/role.model.js";
import RolePermission from "../../modules/roles/role-permission.model.js";
import Permission from "../../modules/permissions/permission.model.js";
import Membership from "../../modules/memberships/membership.model.js";
import MembershipRole from "../../modules/member-roles/member-role.model.js";
import Task from "../../modules/tasks/task.model.js";
import AccessRequest from "../../modules/access/access-request.model.js";
import AccessGrant from "../../modules/access/access-grant.model.js";
import AuditLog from "../../modules/audit/audit-log.model.js";
import Notification from "../../modules/notifications/notification.model.js";
import Invitation from "../../modules/invitations/invitation.model.js";

import { permissionSeedData } from "../../modules/permissions/permissions.seed.js";

const DEFAULT_PASSWORD = "Password123!";

const FIRST_NAMES = [
  "Alexander", "Sophia", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Ava", "Lucas", "Isabella",
  "Mason", "Mia", "Oliver", "Amelia", "Elijah", "Harper", "Logan", "Evelyn", "James", "Abigail",
  "Benjamin", "Emily", "Aiden", "Elizabeth", "Jackson", "Mila", "Sebastian", "Ella", "David", "Avery",
  "Carter", "Sofia", "Wyatt", "Camila", "Jayden", "Aria", "John", "Scarlett", "Owen", "Victoria",
  "Dylan", "Madison", "Luke", "Luna", "Gabriel", "Grace", "Anthony", "Chloe", "Isaac", "Penelope",
  "Grayson", "Layla", "Jack", "Riley", "Julian", "Zoey", "Levi", "Nora", "Christopher", "Lily",
  "Joshua", "Eleanor", "Andrew", "Hannah", "Lincoln", "Lillian", "Mateo", "Addison", "Ryan", "Aubrey",
  "Jaxon", "Ellie", "Nathan", "Stella", "Aaron", "Natalie", "Isaiah", "Zoe", "Thomas", "Leah",
  "Charles", "Hazel", "Caleb", "Violet", "Josiah", "Aurora", "Christian", "Savannah", "Hunter", "Audrey",
  "Eli", "Brooklyn", "Jonathan", "Bella", "Connor", "Claire", "Landon", "Skylar", "Adrian", "Lucy",
  "Prakash", "Kavya", "Rahul", "Ananya", "Vikram", "Pooja", "Arjun", "Neha", "Rohan", "Sneha",
  "Carlos", "Elena", "Mateo", "Valentina", "Diego", "Lucia", "Santiago", "Camila", "Javier", "Gabriela",
  "Kenji", "Yuki", "Hiroshi", "Hana", "Takashi", "Mei", "Daiki", "Aoi", "Ren", "Sakura",
  "Lars", "Astrid", "Frederik", "Freja", "Magnus", "Ingrid", "Soren", "Maja", "Henrik", "Signe"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez",
  "Sharma", "Verma", "Kapoor", "Iyer", "Nair", "Reddy", "Rao", "Bose", "Mehta", "Chatterjee",
  "Tanaka", "Sato", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
  "Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann"
];

const ENTERPRISE_TEAMS = [
  {
    name: "People Operations & Global HR",
    description: "Global human resources, talent acquisition, employee development, benefits, and workplace culture.",
    category: "NON_TECH",
    roles: [
      { name: "Chief People Officer", isLead: true, permKeys: ["*"] },
      { name: "Talent Acquisition Lead", permKeys: ["user.read", "user.create", "invitation.read", "invitation.create", "invitation.resend", "membership.read", "membership.create", "team.read", "task.read", "task.create", "notification.read"] },
      { name: "People Business Partner", permKeys: ["user.read", "membership.read", "membership.update", "team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Compensation & Benefits Specialist", permKeys: ["user.read", "membership.read", "team.read", "task.read", "task.create", "audit.read", "notification.read"] },
      { name: "HR Operations Associate", permKeys: ["user.read", "team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "HR Intern", permKeys: ["team.read", "task.read", "notification.read"] },
    ],
    taskTemplates: [
      "Q4 Global Talent Acquisition & Campus Outreach",
      "Executive Leadership Coaching & Performance Framework",
      "Annual Compensation & Market Salary Benchmark Review",
      "Employee Wellness & Mental Health Benefit Rollout",
      "Workplace Diversity, Equity & Inclusion Annual Audit",
      "New Employee Automated Onboarding Pipeline",
      "Quarterly 360-Degree Feedback Cycle Administration",
      "Global Remote Work Compliance & Visa Sponsorship",
    ]
  },
  {
    name: "Legal, Governance & Corporate Compliance",
    description: "Corporate legal governance, commercial contracts, regulatory compliance, risk management, and IP protection.",
    category: "NON_TECH",
    roles: [
      { name: "General Counsel", isLead: true, permKeys: ["*"] },
      { name: "Senior Compliance Officer", permKeys: ["audit.read", "user.read", "team.read", "role.read", "permission.read", "access_request.read", "access_grant.read", "task.read", "task.create", "notification.read"] },
      { name: "Contracts & Regulatory Specialist", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Privacy & Risk Analyst", permKeys: ["audit.read", "team.read", "task.read", "task.create", "access_request.create", "notification.read"] },
      { name: "Legal Assistant", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "External Legal Auditor", permKeys: ["audit.read", "team.read", "task.read", "role.read"] },
    ],
    taskTemplates: [
      "SOC-2 Type II Annual Recertification Audit",
      "GDPR & CCPA Data Privacy Impact Assessment",
      "Enterprise Master Services Agreement (MSA) Standard Updates",
      "Vendor Data Processing Agreements (DPA) Review",
      "Trademark & Intellectual Property Portfolio Audit",
      "Whistleblower & Anti-Bribery Compliance Refresher",
      "Cross-Border Data Transfer Risk Analysis",
      "Annual SEC / Financial Regulatory Filings Verification",
    ]
  },
  {
    name: "Global Marketing & Brand Strategy",
    description: "Omnichannel digital marketing, brand identity, global campaigns, product marketing, and public relations.",
    category: "NON_TECH",
    roles: [
      { name: "VP of Global Marketing", isLead: true, permKeys: ["*"] },
      { name: "Growth Marketing Director", permKeys: ["team.read", "membership.read", "invitation.create", "task.read", "task.create", "task.update", "task.delete", "notification.read", "notification.update"] },
      { name: "Content Strategy Lead", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Brand & PR Specialist", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "SEO & Digital Media Analyst", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Creative Design Associate", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
      { name: "Marketing Intern", permKeys: ["team.read", "task.read", "notification.read"] },
    ],
    taskTemplates: [
      "Q1 Brand Repositioning & Global Campaign Launch",
      "Product-Led Growth (PLG) Onboarding Funnel Optimization",
      "Organic Search & Technical SEO Architecture Overhaul",
      "Customer Case Studies & Enterprise Video Testimonials",
      "Annual Global Developer Conference Keynote Strategy",
      "Paid Social Acquisition ROI & Attribution Modeling",
      "Influencer & Industry Analyst Outreach Briefing",
      "Email Nurture Sequences & Re-engagement Campaign",
    ]
  },
  {
    name: "Finance, Treasury & Billing Operations",
    description: "Financial planning, accounting, treasury management, tax compliance, payroll, and billing infrastructure.",
    category: "NON_TECH",
    roles: [
      { name: "Chief Financial Officer", isLead: true, permKeys: ["*"] },
      { name: "Senior Financial Auditor", permKeys: ["audit.read", "user.read", "team.read", "membership.read", "task.read", "task.create", "notification.read"] },
      { name: "Treasury & Payroll Manager", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Billing & Accounts Specialist", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Financial Analyst", permKeys: ["team.read", "task.read", "task.create", "audit.read", "notification.read"] },
      { name: "Finance Associate", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "Annual Budgeting & Departmental P&L Forecasting",
      "Automated Stripe & Wire Transfer Invoicing Reconciliation",
      "Global Corporate Tax & Transfer Pricing Compliance",
      "Monthly Financial Close & Variance Analysis Reporting",
      "Enterprise ARR & Unit Economics Executive Dashboard",
      "Procure-to-Pay Vendor Spend Optimization Audit",
      "Capital Allocation & Treasury Yield Strategy",
      "Payroll Systems Integration & Multi-Currency Processing",
    ]
  },
  {
    name: "Customer Success & Global Client Support",
    description: "Enterprise account management, client retention, technical customer support, and SLA escalations.",
    category: "NON_TECH",
    roles: [
      { name: "VP of Customer Experience", isLead: true, permKeys: ["*"] },
      { name: "Customer Success Lead", permKeys: ["team.read", "membership.read", "invitation.create", "access_request.create", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Tier 3 Escalation Specialist", permKeys: ["team.read", "task.read", "task.create", "task.update", "task.delete", "access_request.create", "notification.read"] },
      { name: "Tier 2 Technical Support Agent", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Tier 1 Support Representative", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
      { name: "Support Trainee", permKeys: ["team.read", "task.read", "notification.read"] },
    ],
    taskTemplates: [
      "Enterprise Customer Onboarding & Health Scoring",
      "High-Priority SLA Ticket Escalation & Incident Postmortem",
      "Client Quarterly Business Reviews (QBR) Scheduling",
      "Self-Serve Knowledge Base & FAQ Documentation",
      "CSAT & NPS Survey Analysis and Action Plan",
      "Proactive Churn Prevention & Account Renewal Campaign",
      "24/7 Follow-the-Sun Support Roster Coordination",
      "Automated Zendesk / Intercom Ticketing Integration",
    ]
  },
  {
    name: "Supply Chain, Procurement & Facilities",
    description: "Physical facilities, hardware procurement, vendor contract management, logistics, and corporate asset lifecycle.",
    category: "NON_TECH",
    roles: [
      { name: "Director of Global Operations", isLead: true, permKeys: ["*"] },
      { name: "Procurement & Vendor Manager", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "audit.read", "notification.read"] },
      { name: "Logistics & Facilities Coordinator", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Operations Associate", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
      { name: "Facilities Inspector", permKeys: ["team.read", "task.read", "notification.read"] },
    ],
    taskTemplates: [
      "Global Hardware Refresh (Laptops, Monitors, Badging)",
      "Tier 1 Data Center Physical Security Audit",
      "Office Space Lease Negotiation & Facilities Expansion",
      "Vendor SLA & Contract Renegotiation Strategy",
      "Emergency Disaster Recovery & Physical Evacuation Drills",
      "Corporate Asset Inventory & Asset Tagging Verification",
    ]
  },
  {
    name: "Cloud Infrastructure, Networks & SRE",
    description: "Multi-region AWS/GCP cloud platforms, Kubernetes clusters, zero-downtime reliability, and telemetry.",
    category: "TECH",
    roles: [
      { name: "Principal Infrastructure Architect", isLead: true, permKeys: ["*"] },
      { name: "Site Reliability Engineer (SRE)", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "task.delete", "access_request.create", "access_request.approve", "access_grant.create", "audit.read", "notification.read"] },
      { name: "DevOps & Cloud Engineer", permKeys: ["team.read", "task.read", "task.create", "task.update", "access_request.create", "notification.read"] },
      { name: "Network Operations Specialist", permKeys: ["team.read", "task.read", "task.create", "task.update", "access_request.create", "notification.read"] },
      { name: "Junior Cloud Associate", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "Kubernetes Multi-Cluster Automated Failover Testing",
      "Terraform Infrastructure-as-Code Module Refactoring",
      "Prometheus & Grafana Enterprise Alerting Threshold Tuning",
      "Cloud Cost FinOps Optimization ($50k/mo Savings)",
      "Zero-Trust Mesh Networking with Istio Service Mesh",
      "Automated Chaos Engineering & Fault Injection Pipeline",
      "Global CDN Edge Caching & Anycast DNS Routing",
      "Database Sharding & Read Replica Topology Expansion",
    ]
  },
  {
    name: "Core Platform & Distributed Systems",
    description: "Core microservices, transaction processing, event-driven messaging, caching layers, and high-throughput APIs.",
    category: "TECH",
    roles: [
      { name: "Engineering Director", isLead: true, permKeys: ["*"] },
      { name: "Staff Systems Architect", permKeys: ["team.read", "membership.read", "role.create", "role.assign", "task.read", "task.create", "task.update", "task.delete", "access_request.create", "notification.read"] },
      { name: "Senior Backend Engineer", permKeys: ["team.read", "task.read", "task.create", "task.update", "task.delete", "access_request.create", "notification.read"] },
      { name: "Microservices Developer", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Junior Software Engineer", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "Distributed Rate Limiting with Redis Leaky Bucket Engine",
      "Kafka Event Bus Partitioning for 100k msg/sec Throughput",
      "GraphQL Federation & API Gateway Routing Layer",
      "Async Worker Pool Architecture with BullMQ & Redis",
      "Database Connection Pooling & Query Optimizer Tuning",
      "gRPC Inter-Service Communication & Protobuf Schemas",
      "Idempotent Payment Webhook Processing Pipeline",
      "Distributed Tracing with OpenTelemetry & Jaeger",
    ]
  },
  {
    name: "Cybersecurity, SOC & IAM Defense",
    description: "Security operations center (SOC), threat hunting, JIT privilege elevation, zero-trust IAM, and penetration testing.",
    category: "TECH",
    roles: [
      { name: "CISO / Security Director", isLead: true, permKeys: ["*"] },
      { name: "SOC Incident Commander", permKeys: ["audit.read", "user.read", "user.update", "user.delete", "team.read", "membership.read", "role.read", "permission.read", "access_request.read", "access_request.approve", "access_grant.create", "access_grant.revoke", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Application Security Lead", permKeys: ["audit.read", "user.read", "team.read", "task.read", "task.create", "task.update", "access_request.create", "notification.read"] },
      { name: "IAM & JIT Privilege Engineer", permKeys: ["audit.read", "role.read", "role.assign", "role.revoke", "access_request.read", "access_request.approve", "access_grant.create", "access_grant.revoke", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Security Analyst", permKeys: ["audit.read", "team.read", "task.read", "task.create", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "Automated JIT Privilege Revocation & TTL Watcher",
      "Annual Third-Party Penetration Testing & Remediation",
      "SIEM Real-Time Anomaly Detection & Threat Hunting",
      "OAuth 2.1 & OpenID Connect PKCE Flow Migration",
      "Secrets Rotation & HashiCorp Vault Integration",
      "Endpoint Detection & Response (EDR) Fleet Rollout",
      "Supply Chain Software Bill of Materials (SBOM) Scanning",
      "Zero-Trust Bastion Host & Mutual TLS Authentication",
    ]
  },
  {
    name: "Data Platform, AI & Machine Learning Lab",
    description: "Enterprise data lakes, real-time analytics, machine learning pipelines, LLM fine-tuning, and MLOps.",
    category: "TECH",
    roles: [
      { name: "Head of AI Research", isLead: true, permKeys: ["*"] },
      { name: "Principal Data Architect", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "task.delete", "access_request.create", "notification.read"] },
      { name: "Senior ML / LLM Engineer", permKeys: ["team.read", "task.read", "task.create", "task.update", "access_request.create", "notification.read"] },
      { name: "Data Pipeline Engineer", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "Junior Data Analyst", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "Custom Enterprise RAG Pipeline with Milvus Vector DB",
      "PyTorch LLM Fine-Tuning on Proprietary Datasets",
      "Real-Time Clickstream Telemetry Pipeline with Flink",
      "Snowflake Data Warehouse Schema & dbt Pipeline Modeling",
      "ML Model Drift Detection & Automated Retraining Engine",
      "Feature Store Deployment with Feast for Low-Latency Inference",
      "Data Governance & Lineage Metadata Cataloging",
      "GPU Cluster Scheduling & vLLM Inference Optimization",
    ]
  },
  {
    name: "Mobile Experience & Digital Products",
    description: "iOS and Android native applications, responsive web clients, design systems, and mobile release engineering.",
    category: "TECH",
    roles: [
      { name: "Product & Mobile Director", isLead: true, permKeys: ["*"] },
      { name: "Staff iOS Engineer", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "task.delete", "notification.read"] },
      { name: "Staff Android Engineer", permKeys: ["team.read", "membership.read", "task.read", "task.create", "task.update", "task.delete", "notification.read"] },
      { name: "UI/UX Product Designer", permKeys: ["team.read", "task.read", "task.create", "task.update", "notification.read"] },
      { name: "QA Automation Specialist", permKeys: ["team.read", "task.read", "task.update", "notification.read"] },
    ],
    taskTemplates: [
      "SwiftUI Navigation Architecture & Offline SQLite Sync",
      "Jetpack Compose UI Performance & Memory Leak Profiling",
      "Biometric Authentication & Secure Enclave Key Storage",
      "Mobile App Store & Play Store CI/CD Fastlane Pipeline",
      "Universal Design Tokens & Dark Mode Theme Engine",
      "Automated End-to-End Testing with Maestro & Appium",
      "Push Notification Routing & Deep Linking Architecture",
      "WebSockets Client Reconnection & Exponential Backoff",
    ]
  }
];

export async function runScaleSeed() {
  const startTime = Date.now();
  console.log("=========================================================");
  console.log("  ENTERPRISE DATABASE SEEDER (10,000 USERS + 11 TEAMS)   ");
  console.log("=========================================================\n");

  const db = mongoose.connection.db;

  console.log("-> Dropping and cleaning existing database collections...");
  const collections = [
    "users", "teams", "roles", "rolepermissions", "permissions",
    "memberships", "membershiproles", "tasks", "invitations",
    "accessrequests", "accessgrants", "auditlogs", "notifications"
  ];
  for (const col of collections) {
    try {
      await db.collection(col).deleteMany({});
    } catch (e) {
      // ignore
    }
  }
  console.log("   ✓ Collections wiped cleanly.\n");

  console.log("-> Synchronizing Mongoose model schemas and building compound indexes in MongoDB...");
  const models = [
    User, Team, Role, RolePermission, Permission,
    Membership, MembershipRole, Task, Invitation,
    AccessRequest, AccessGrant, AuditLog, Notification
  ];
  for (const model of models) {
    try {
      await model.init();
      await model.syncIndexes();
    } catch (err) {
      // ignore index conflict warnings if already matched
    }
  }
  console.log("   ✓ All model schemas and compound indexes synchronized.\n");

  console.log("-> Seeding 39 Canonical Permissions...");
  const permDocs = permissionSeedData.map((p) => ({
    _id: new mongoose.Types.ObjectId(),
    ...p,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  await Permission.insertMany(permDocs);
  const permissionMap = new Map();
  for (const p of permDocs) {
    permissionMap.set(p.key, p);
  }
  console.log(`   ✓ ${permDocs.length} Permissions inserted.\n`);

  console.log("-> Pre-computing enterprise password hash for 'Password123!'...");
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  console.log("   ✓ Password hash generated.\n");

  const rootAdminId = new mongoose.Types.ObjectId();
  const rootAdminUser = {
    _id: rootAdminId,
    name: "System Administrator",
    email: "admin@system.local",
    hashedPassword,
    accountStatus: "ACTIVE",
    mustChangePassword: false,
    isSuperAdmin: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  console.log("-> Creating System Roles and 11 Team Bespoke Roles...");
  const allRolesToInsert = [];
  const allRolePermsToInsert = [];
  const roleMap = new Map();

  const superAdminRoleId = new mongoose.Types.ObjectId();
  const teamAdminRoleId = new mongoose.Types.ObjectId();

  const superAdminRole = {
    _id: superAdminRoleId,
    name: "Super Admin",
    description: "Platform super administrator with unrestricted wildcard authority.",
    createdBy: rootAdminId,
    isSystemRole: true,
    status: "ACTIVE",
    permissions: permDocs.map(p => p._id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  allRolesToInsert.push(superAdminRole);
  roleMap.set("Super Admin", superAdminRole);

  for (const p of permDocs) {
    allRolePermsToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      roleId: superAdminRoleId,
      permissionId: p._id
    });
  }

  const teamAdminRole = {
    _id: teamAdminRoleId,
    name: "Team Admin",
    description: "Full administrative authority over workspace members, roles, tasks, and access.",
    createdBy: rootAdminId,
    isSystemRole: true,
    status: "ACTIVE",
    permissions: permDocs.map(p => p._id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  allRolesToInsert.push(teamAdminRole);
  roleMap.set("Team Admin", teamAdminRole);

  for (const p of permDocs) {
    allRolePermsToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      roleId: teamAdminRoleId,
      permissionId: p._id
    });
  }

  for (const teamDef of ENTERPRISE_TEAMS) {
    for (const rDef of teamDef.roles) {
      if (roleMap.has(rDef.name)) continue;

      const rId = new mongoose.Types.ObjectId();
      const mappedPermDocs = rDef.permKeys === "*" || rDef.permKeys.includes("*")
        ? permDocs
        : rDef.permKeys.map(k => permissionMap.get(k)).filter(Boolean);

      const roleDoc = {
        _id: rId,
        name: rDef.name,
        description: `${teamDef.name} - ${rDef.name} role with tailored permissions.`,
        createdBy: rootAdminId,
        isSystemRole: false,
        status: "ACTIVE",
        permissions: mappedPermDocs.map(p => p._id),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      allRolesToInsert.push(roleDoc);
      roleMap.set(rDef.name, roleDoc);

      for (const p of mappedPermDocs) {
        allRolePermsToInsert.push({
          _id: new mongoose.Types.ObjectId(),
          roleId: rId,
          permissionId: p._id
        });
      }
    }
  }

  await Role.insertMany(allRolesToInsert);
  await RolePermission.insertMany(allRolePermsToInsert);
  console.log(`   ✓ Created ${allRolesToInsert.length} distinct roles across teams.\n`);

  console.log("-> Creating 11 Enterprise Teams (6 Non-Tech, 5 Tech)...");
  const createdTeams = [];
  for (const teamDef of ENTERPRISE_TEAMS) {
    const tId = new mongoose.Types.ObjectId();
    const teamDoc = {
      _id: tId,
      name: teamDef.name,
      description: teamDef.description,
      createdBy: rootAdminId,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
    createdTeams.push(teamDoc);
  }
  await Team.insertMany(createdTeams);
  console.log(`   ✓ Created ${createdTeams.length} enterprise teams.\n`);

  console.log("-> Generating 10,000 Users across all lifecycle stages...");
  const usersToInsert = [rootAdminUser];
  const usedEmails = new Set(["admin@system.local"]);
  const TOTAL_USERS = 10000;

  for (let i = 2; i <= TOTAL_USERS; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let email = `${emailPrefix}@enterprise.internal`;

    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${emailPrefix}${counter}@enterprise.internal`;
      counter++;
    }
    usedEmails.add(email);

    let isSuperAdmin = false;
    let accountStatus = "ACTIVE";
    let mustChangePassword = false;

    if (i <= 20) {
      isSuperAdmin = true;
    } else if (i > 20 && i <= 520) {
      mustChangePassword = true;
    } else if (i > 520 && i <= 820) {
      accountStatus = "SUSPENDED";
    } else if (i > 820 && i <= 1020) {
      accountStatus = "DISABLED";
    }

    const createdAtDaysAgo = Math.floor(Math.random() * 200) + 5;
    usersToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      name: `${firstName} ${lastName}`,
      email,
      hashedPassword,
      accountStatus,
      mustChangePassword,
      isSuperAdmin,
      createdAt: new Date(Date.now() - createdAtDaysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }

  console.log("   Inserting users in high-speed batches...");
  for (let i = 0; i < usersToInsert.length; i += 2500) {
    const chunk = usersToInsert.slice(i, i + 2500);
    await User.insertMany(chunk, { ordered: false });
  }
  console.log(`   ✓ 10,000 Users successfully created in database.\n`);

  console.log("-> Distributing 10,000 users into Teams (~700 - 1,500 members per team)...");
  const membershipsToInsert = [];
  const memberRolesToInsert = [];

  for (const team of createdTeams) {
    const mId = new mongoose.Types.ObjectId();
    membershipsToInsert.push({
      _id: mId,
      userId: rootAdminId,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [teamAdminRoleId],
      joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    });
    memberRolesToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      membershipId: mId,
      roleId: teamAdminRoleId,
      assignedBy: rootAdminId,
      assignedAt: new Date()
    });
  }

  const userList = usersToInsert.slice(1);

  userList.forEach((user, index) => {
    const primaryTeamIndex = index % createdTeams.length;
    const primaryTeam = createdTeams[primaryTeamIndex];
    const teamDef = ENTERPRISE_TEAMS[primaryTeamIndex];

    let selectedRoleName;
    if (index % 17 === 0) {
      selectedRoleName = "Team Admin";
    } else {
      const nonLeadRoles = teamDef.roles.filter(r => !r.isLead);
      const roleDef = nonLeadRoles[index % nonLeadRoles.length];
      selectedRoleName = roleDef.name;
    }

    const assignedRole = roleMap.get(selectedRoleName) || teamAdminRole;
    const mId1 = new mongoose.Types.ObjectId();
    const joinedAt = user.createdAt;

    membershipsToInsert.push({
      _id: mId1,
      userId: user._id,
      teamId: primaryTeam._id,
      status: user.accountStatus === "DISABLED" ? "REMOVED" : "ACTIVE",
      roleIds: [assignedRole._id],
      joinedAt
    });

    memberRolesToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      membershipId: mId1,
      roleId: assignedRole._id,
      assignedBy: rootAdminId,
      assignedAt: joinedAt
    });

    if (index % 5 < 2) {
      const secondaryTeamIndex = (primaryTeamIndex + 3) % createdTeams.length;
      const secondaryTeam = createdTeams[secondaryTeamIndex];
      const secTeamDef = ENTERPRISE_TEAMS[secondaryTeamIndex];
      const secRoleDef = secTeamDef.roles[secTeamDef.roles.length - 1];
      const secRole = roleMap.get(secRoleDef.name) || assignedRole;

      const mId2 = new mongoose.Types.ObjectId();
      membershipsToInsert.push({
        _id: mId2,
        userId: user._id,
        teamId: secondaryTeam._id,
        status: user.accountStatus === "DISABLED" ? "REMOVED" : "ACTIVE",
        roleIds: [secRole._id],
        joinedAt: new Date(joinedAt.getTime() + 1000 * 60 * 60 * 24 * 7)
      });

      memberRolesToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        membershipId: mId2,
        roleId: secRole._id,
        assignedBy: rootAdminId,
        assignedAt: joinedAt
      });
    }
  });

  console.log(`   Inserting ${membershipsToInsert.length} memberships in chunks...`);
  for (let i = 0; i < membershipsToInsert.length; i += 2500) {
    const chunk = membershipsToInsert.slice(i, i + 2500);
    await Membership.insertMany(chunk, { ordered: false });
  }

  console.log(`   Inserting ${memberRolesToInsert.length} membership-role junctions...`);
  for (let i = 0; i < memberRolesToInsert.length; i += 2500) {
    const chunk = memberRolesToInsert.slice(i, i + 2500);
    await MembershipRole.insertMany(chunk, { ordered: false });
  }
  console.log(`   ✓ ${membershipsToInsert.length} Memberships and Roles mapped.\n`);

  console.log("-> Generating 4,500 domain-specific Tasks across 11 teams...");
  const tasksToInsert = [];
  const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
  const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  createdTeams.forEach((team, tIdx) => {
    const teamDef = ENTERPRISE_TEAMS[tIdx];
    const templates = teamDef.taskTemplates;

    for (let k = 0; k < 410; k++) {
      const template = templates[k % templates.length];
      const taskNum = k + 1;
      const title = `[${teamDef.category}] ${template} #${taskNum}`;
      const status = TASK_STATUSES[k % TASK_STATUSES.length];
      const priority = PRIORITIES[k % PRIORITIES.length];
      const assignedUser = userList[(tIdx * 400 + k) % userList.length];

      tasksToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        title,
        description: `Operational deliverable for ${team.name}. Requires tracking, compliance verification, and execution.`,
        teamId: team._id,
        createdBy: rootAdminId,
        assignedTo: status === "TODO" && k % 3 === 0 ? null : assignedUser._id,
        status,
        priority,
        dueDate: new Date(Date.now() + (k % 30 - 10) * 24 * 60 * 60 * 1000),
        remarks: status === "DONE" ? "Completed and verified by team lead." : "",
        createdAt: new Date(Date.now() - (k % 90) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }
  });

  for (let i = 0; i < tasksToInsert.length; i += 2500) {
    const chunk = tasksToInsert.slice(i, i + 2500);
    await Task.insertMany(chunk, { ordered: false });
  }
  console.log(`   ✓ ${tasksToInsert.length} Tasks generated across all teams.\n`);

  console.log("-> Generating JIT Access Requests and Active Elevation Grants...");
  const accessRequestsToInsert = [];
  const accessGrantsToInsert = [];

  const jitCandidates = userList.slice(0, 250);
  jitCandidates.forEach((user, idx) => {
    const team = createdTeams[idx % createdTeams.length];
    const isApproved = idx < 180;
    const reqId = new mongoose.Types.ObjectId();
    const permKey = idx % 2 === 0 ? "audit.read" : "task.delete";
    const permDoc = permissionMap.get(permKey) || permDocs[0];

    accessRequestsToInsert.push({
      _id: reqId,
      requesterId: user._id,
      targetUserId: user._id,
      teamId: team._id,
      permissionId: permDoc._id,
      permissionKey: permDoc.key,
      resource: `team:${team._id}`,
      reason: `Emergency operational requirement: incident mitigation and data investigation for ${team.name}.`,
      durationMinutes: 120,
      status: isApproved ? "APPROVED" : (idx % 3 === 0 ? "PENDING" : "REJECTED"),
      reviewedBy: isApproved ? rootAdminId : null,
      reviewedAt: isApproved ? new Date() : null,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date()
    });

    if (isApproved) {
      accessGrantsToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        teamId: team._id,
        permissionId: permDoc._id,
        permissionKey: permDoc.key,
        resource: `team:${team._id}`,
        grantedBy: rootAdminId,
        expiresAt: new Date(Date.now() + (idx + 10) * 60 * 1000),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });

  await AccessRequest.insertMany(accessRequestsToInsert);
  await AccessGrant.insertMany(accessGrantsToInsert);
  console.log(`   ✓ ${accessRequestsToInsert.length} JIT Requests & ${accessGrantsToInsert.length} Active Grants created.\n`);

  console.log("-> Generating 8,000+ Enterprise Audit Logs...");
  const auditLogsToInsert = [];
  const AUDIT_ACTIONS = [
    "user.login", "user.logout", "team.created", "task.created",
    "task.updated", "role.assigned", "access_request.created",
    "access_grant.issued", "membership.added"
  ];

  for (let i = 0; i < 8500; i++) {
    const actor = usersToInsert[i % usersToInsert.length];
    const team = createdTeams[i % createdTeams.length];
    const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];

    auditLogsToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      actorId: actor._id,
      action,
      targetType: action.startsWith("task") ? "Task" : (action.startsWith("team") ? "Team" : "User"),
      targetId: team._id,
      teamId: team._id,
      metadata: {
        actorEmail: actor.email,
        teamName: team.name,
        ipAddress: `10.0.${Math.floor(i / 256)}.${i % 256}`
      },
      result: "SUCCESS",
      ipAddress: `10.0.${Math.floor(i / 256)}.${i % 256}`,
      userAgent: "Mozilla/5.0 Enterprise-Node-Agent",
      createdAt: new Date(Date.now() - (i % 60) * 24 * 60 * 60 * 1000)
    });
  }

  for (let i = 0; i < auditLogsToInsert.length; i += 2500) {
    const chunk = auditLogsToInsert.slice(i, i + 2500);
    await AuditLog.insertMany(chunk, { ordered: false });
  }
  console.log(`   ✓ ${auditLogsToInsert.length} Audit Logs generated.\n`);

  try {
    const redis = getRedisClient();
    if (redis) {
      console.log("-> Flushing Redis cache keys...");
      await redis.flushdb();
      console.log("   ✓ Redis flushed.\n");
    }
  } catch (e) {
    // ignore
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("=========================================================");
  console.log(`  HIGH-SCALE SEEDING COMPLETE in ${durationSec}s!        `);
  console.log("=========================================================");
  console.log(`  Total Users:            ${usersToInsert.length.toLocaleString()}`);
  console.log(`  Total Teams:            ${createdTeams.length} (6 Non-Tech, 5 Tech)`);
  console.log(`  Total Roles:            ${allRolesToInsert.length}`);
  console.log(`  Total Memberships:      ${membershipsToInsert.length.toLocaleString()}`);
  console.log(`  Total Tasks:            ${tasksToInsert.length.toLocaleString()}`);
  console.log(`  Active JIT Grants:      ${accessGrantsToInsert.length}`);
  console.log(`  Total Audit Logs:       ${auditLogsToInsert.length.toLocaleString()}`);
  console.log("---------------------------------------------------------");
  console.log("  Super Admin Login:      admin@system.local / Password123!");
  console.log("  Any Enterprise User:    <first>.<last>@enterprise.internal / Password123!");
  console.log("=========================================================\n");
}

if (process.argv[1]?.endsWith("seed.js")) {
  (async () => {
    try {
      await connectDatabase(env.mongoUri);
      await runScaleSeed();
    } catch (err) {
      console.error("Seed error:", err);
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}