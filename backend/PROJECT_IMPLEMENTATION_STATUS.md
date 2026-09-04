# Multi-Tenant Team Management & Dynamic RBAC System
## Implementation & Architecture Report

**Last Updated:** August 28, 2026  
**Active Branch:** `revamp/server-architecture`

---

## 📑 Table of Contents
1. [System Architecture & Core Principles](#1-system-architecture--core-principles)
2. [Implemented Feature Modules](#2-implemented-feature-modules)
   - [Core Foundation, Database & Documentation](#core-foundation-database--documentation)
   - [Authentication & Identity Lifecycle](#authentication--identity-lifecycle)
   - [Context-Aware Dynamic Authorization Engine](#context-aware-dynamic-authorization-engine)
   - [Dynamic RBAC Control Plane](#dynamic-rbac-control-plane)
   - [Multi-Tenant Workspace & Membership Management](#multi-tenant-workspace--membership-management)
   - [Granular Access Requests & Temporary Grants](#granular-access-requests--temporary-grants)
   - [Workspace Invitations & Token-Based Provisioning](#workspace-invitations--token-based-provisioning)
   - [Team Tasks & Resource-Level Authorization](#team-tasks--resource-level-authorization)
3. [Implemented API Endpoints Catalog](#3-implemented-api-endpoints-catalog)
4. [Database Models & Junction Schemas](#4-database-models--junction-schemas)
5. [Automated Verification & Test Suites](#5-automated-verification--test-suites)
6. [Next Session Focus: Phase 9 — Real-time WebSockets, Live Notifications & Team Chat Collaboration](#6-next-session-focus-phase-9--real-time-websockets-live-notifications--team-chat-collaboration)

---

## 1. System Architecture & Core Principles

This project is a multi-tenant enterprise backend implementing **Dynamic, Context-Aware Role-Based Access Control (RBAC)** using Node.js, Express 5.x, MongoDB, and Mongoose.

### Architectural Core Principles
1. **Zero Hardcoded Roles:** Access decisions are strictly permission-key driven (`can(userId, teamId, permissionKey)`), never hardcoding role strings like `if (user.role === 'admin')`.
2. **Multi-Tenant Isolation:** Team workspaces are completely isolated. An administrator in Team A has zero elevated privileges in Team B unless explicitly assigned.
3. **Separation of Concerns:**
   - **Identity Layer:** Authenticates *who* the user is (JWT issuance, password security).
   - **Presence Layer:** Establishes *where* the user belongs via `Membership` (`ACTIVE`, `SUSPENDED`, `REMOVED`).
   - **Authority Layer:** Resolves *what* permissions the user has via `MembershipRole` $\rightarrow$ `Role` $\rightarrow$ `RolePermission` $\rightarrow$ `Permission`.

```
                        ┌────────────────────────┐
                        │   Incoming HTTP Req    │
                        └───────────┬────────────┘
                                    │
                       authenticateToken Middleware
                        (Extracts User & Validates JWT)
                                    │
                                    ▼
                       requirePermission(permKey)
                        (Dynamic Route Guard)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Authorization Policy Engine: can(userId, teamId, permKey)              │
│                                                                        │
│ 1. Validate User Account Status (ACTIVE)                               │
│ 2. Find Membership (userId + teamId) -> Must be ACTIVE                 │
│ 3. Fetch Active, Non-Expired MembershipRoles (revokedAt: null, TTL)   │
│ 4. Resolve Active Roles & Attached RolePermissions                     │
│ 5. Match Canonical Permission Key (exact or wildcard, e.g. task.*)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
                 [ ALLOW ]                     [ DENY ]
              Proceeds to Service           403 Forbidden
```

---

## 2. Implemented Feature Modules

### Core Foundation, Database & Documentation
- **Layered Architecture:** Strict separation between Routes, Controllers, Services, Models, and Middleware.
- **Centralized Error Handling:** Domain-aware `errorHandler` middleware standardizing API error structures (`{ success: false, error: { message, code, statusCode } }`).
- **Database Connection & Seeding:** Resilient MongoDB connection with automated seed script (`seed.js`) initializing 5 immutable system roles (`Super Admin`, `Team Admin`, `Developer`, `Viewer`, `Security Auditor`), canonical permissions, test users, and team workspaces.
- **Interactive API Documentation:** OpenAPI 3.0 specification (`openapi.yaml`) served live via Swagger UI at `/api-docs`.

---

### Authentication & Identity Lifecycle
- **Credential Verification:** Salted bcrypt hashing and verification for secure user login.
- **JWT Issuance & Verification:** Signed JSON Web Tokens with standard `sub` claims, token expiration, and tamper prevention.
- **Account State Machine:** Validation for `ACTIVE`, `INVITED`, `SUSPENDED`, and `DISABLED` user statuses.
- **Password Lifecycle & Activation:** Forced password reset mechanism that automatically transitions `INVITED` users with temporary credentials into `ACTIVE` users upon their first password update.
- **Authenticated Identity Endpoint:** `/api/auth/me` returning sanitized user identity data without exposing sensitive fields.

---

### Context-Aware Dynamic Authorization Engine
- **Core Policy Evaluator (`can`):** Central evaluator function resolving live MongoDB collections in real-time without static assumptions.
- **Evaluation Pipeline:**
  - Multi-tenant boundary checks.
  - Active membership verification.
  - Active role filtering (excluding soft-deleted or inactive roles).
  - Time-To-Live (TTL) expiration enforcement on role assignments.
  - Wildcard permission support (e.g. granting `task.*` resolves to `task.create`, `task.read`, etc.).
- **Route Guard Middleware:** `requirePermission(permissionKey)` protecting sensitive endpoints.
- **Evaluation Endpoint:** `POST /api/authorization/evaluate` for real-time permission evaluation.

---

### Dynamic RBAC Control Plane
- **Canonical Permissions Catalog:** `GET /api/permissions` supporting category, resource, and action filtering.
- **Dynamic Role Management:** Complete CRUD operations on custom roles (`/api/roles`).
- **System Role Immutability:** Protected system flags prevent deleting, renaming, or modifying default system roles.
- **Role-Permission Junctions:** `/api/roles/:roleId/permissions` for attaching and detaching granular permissions.
- **Team-Scoped Role Assignments:** Member role assignments (`/api/teams/:teamId/members/:userId/roles`) with support for custom TTLs and soft-revocation (`revokedAt`).

---

### Multi-Tenant Workspace & Membership Management
- **Team Workspace Management:** Full CRUD operations at `/api/teams` (creation, pagination, detail retrieval, updates, and soft-archival).
- **Membership Operations:** Direct member onboarding (`POST /api/teams/:teamId/members`).
- **Membership Lifecycle:** State transitions (`ACTIVE`, `SUSPENDED`, `REMOVED`) with role cascade protections.
- **User Discovery Service:** Safe public directory search at `/api/users/search` enabling administrators to discover and add users to teams.

---

### Granular Access Requests & Temporary Grants
- **Self-Service Elevation & JIT Access:**
  - `access.service.js`: Domain service managing time-bounded privilege requests (`createAccessRequest`, `getAccessRequestsByTeam`, `getAccessRequestById`).
  - Requester Self-Correction: Original requesters can edit (`updateAccessRequest`) or withdraw/delete (`deleteAccessRequest`) requests while in `PENDING` status.
- **Reviewer Workflow & Anti-Self-Approval Controls:**
  - `approveAccessRequest`: Transitions request to `APPROVED` and atomically issues an active `AccessGrant` document with TTL expiration. Strictly enforces `reviewerId !== requesterId`.
  - `rejectAccessRequest`: Records rejection decision and optional feedback reason.
  - `revokeAccessGrant`: Soft-revokes an active grant (`status: "REVOKED"`).
- **Automated Verification:**
  - `access.test.js`: 14/14 test scenarios verified covering duplicate prevention, requester self-correction, anti-self-approval, and live `can()` policy evaluation.

---

### Workspace Invitations & Token-Based Provisioning
- **Model & Cryptographic Foundations:**
  - `invitation.model.js`: Configured with `roleIds` array, `tokenHash`, and compound unique index.
  - `invitations.utils.js`: 32-byte cryptographic random token generation and SHA-256 hash evaluation.
- **Invitation Management Service & APIs:**
  - `createInvitation`: 1-hour expiration TTL, collision prevention against existing active members and duplicate pending invitations.
  - `getTeamInvitations`: Auditing endpoint listing pending and historical workspace invitations.
  - `revokeInvitation`: Revoking pending invitations with state transition to `REVOKED`.
- **Public Onboarding & ACID Multi-Document Provisioning:**
  - `acceptInvitation`: Public endpoint (`POST /api/invitations/accept`) verifying single-use tokens, handling dual-path onboarding (new user provisioning with salted bcrypt password hash vs. existing user account linking), auto-creating `Membership` & batch assigning `MembershipRole` records inside a MongoDB ACID transaction (`session.withTransaction`), and issuing immediate JWT session tokens.
- **Automated Verification:**
  - `invitation.test.js`: 16/16 test scenarios verified with zero regressions across entire workspace.

---

### Team Tasks & Resource-Level Authorization
- **Domain Service & Isolation Architecture:**
  - `task.service.js`: Multi-tenant domain logic strictly enforcing `{ _id: taskId, teamId }` boundary containment on all lookups, updates, and deletes.
  - Active Assignee Verification: Checks `Membership.findOne({ teamId, userId: assignedTo, status: "ACTIVE" })` to prevent assigning tasks to cross-tenant or deactivated users.
  - Immutable Field Protection: Whitelisted payload extraction prevents tampering with `teamId`, `createdBy`, or `_id`.
  - DoS-Resistant Safe Pagination: Capped `limit` (max 100) and parallel query execution with `Promise.all([Task.find(...), Task.countDocuments(...)])`.
- **HTTP Routing & Dynamic Resource-Level Policy Guards:**
  - Mounted under `/api/teams/:teamId/tasks` using `{ mergeParams: true }`.
  - Guarded with `requirePermission("task.create")`, `requirePermission("task.read")`, `requirePermission("task.update")`, and `requirePermission("task.delete")`.
  - Automatic resolution of concrete resource IDs (`task:<taskId>`) enabling temporary grant overrides.
- **Automated Verification:**
  - `task.test.js`: 12/12 positive and negative security test cases passing (103 total workspace tests passing).

---

## 3. Implemented API Endpoints Catalog

### Authentication (`/api/auth`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/auth/change-password` | Update user password & activate account | Yes |

### Authorization Engine (`/api/authorization`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/authorization/evaluate` | Dynamic policy evaluation (`can`) | `authenticateToken` |

### Permissions Catalog (`/api/permissions`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/permissions` | List all canonical permissions with filters | `permission.read` |
| `GET` | `/api/permissions/:permissionId` | Get single permission detail | `permission.read` |

### Roles Management (`/api/roles`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/roles` | Create dynamic custom role | `role.create` |
| `GET` | `/api/roles` | List all roles (active/system) | `role.read` |
| `GET` | `/api/roles/:roleId` | Get role details with permissions | `role.read` |
| `PATCH` | `/api/roles/:roleId` | Update role name / description | `role.update` |
| `DELETE` | `/api/roles/:roleId` | Delete custom role (system roles blocked) | `role.delete` |
| `POST` | `/api/roles/:roleId/permissions` | Attach permission to role | `permission.assign` |
| `DELETE` | `/api/roles/:roleId/permissions/:permissionId`| Detach permission from role | `permission.assign` |

### Teams Management (`/api/teams`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams` | Create new team workspace | `team.create` |
| `GET` | `/api/teams` | List teams (paginated, searchable) | `team.read` |
| `GET` | `/api/teams/:teamId` | Get team workspace details | `team.read` |
| `PATCH` | `/api/teams/:teamId` | Update team details | `team.update` |
| `DELETE` | `/api/teams/:teamId` | Soft-archive team workspace | `team.delete` |

### Team Memberships (`/api/teams/:teamId/members`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams/:teamId/members` | Add member to team | `membership.create` |
| `GET` | `/api/teams/:teamId/members` | List members of a team | `membership.read` |
| `GET` | `/api/teams/:teamId/members/:membershipId` | Get member details & roles | `membership.read` |
| `PATCH` | `/api/teams/:teamId/members/:membershipId/suspend` | Suspend membership | `membership.update` |
| `PATCH` | `/api/teams/:teamId/members/:membershipId/reactivate` | Reactivate membership | `membership.update` |
| `DELETE` | `/api/teams/:teamId/members/:membershipId` | Remove member from team workspace | `membership.remove` |

### Team Membership Roles (`/api/teams/:teamId/members/:userId/roles`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams/:teamId/members/:userId/roles` | Assign role to member (supports TTL) | `role.assign` |
| `GET` | `/api/teams/:teamId/members/:userId/roles` | List member assigned roles | `role.read` |
| `DELETE` | `/api/teams/:teamId/members/:userId/roles/:assignmentId` | Revoke assigned role | `role.revoke` |

### Users Discovery (`/api/users`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/users/search` | Safe directory user search | `user.read` |

### Workspace Invitations (`/api/teams/:teamId/invitations` & `/api/invitations`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams/:teamId/invitations` | Issue 1-hour cryptographic invite token with pre-assigned roles | `membership.create` |
| `GET` | `/api/teams/:teamId/invitations` | List team workspace invitations | `membership.read` |
| `DELETE` | `/api/teams/:teamId/invitations/:invitationId` | Revoke pending invitation | `membership.delete` |
| `POST` | `/api/invitations/accept` | Public invitation acceptance & user provisioning gateway | Public |

### Team Tasks (`/api/teams/:teamId/tasks`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams/:teamId/tasks` | Create team-scoped task with active assignee validation | `task.create` |
| `GET` | `/api/teams/:teamId/tasks` | List workspace tasks with pagination & filtering | `task.read` |
| `GET` | `/api/teams/:teamId/tasks/:taskId` | Get single task details | `task.read` |
| `PATCH` | `/api/teams/:teamId/tasks/:taskId` | Mutate task status, priority, and assignment | `task.update` |
| `DELETE` | `/api/teams/:teamId/tasks/:taskId` | Tenant-scoped task deletion | `task.delete` |

### Access Requests & Grants (`/api/teams/:teamId/access-requests`)
| Method | Route | Description | Guard |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/teams/:teamId/access-requests` | Submit temporary privilege elevation request | `access_request.create` |
| `GET` | `/api/teams/:teamId/access-requests` | List team access requests with status/user filters | `access_request.read` |
| `GET` | `/api/teams/:teamId/access-requests/:requestId` | Get access request details | `access_request.read` |
| `PATCH` | `/api/teams/:teamId/access-requests/:requestId` | Edit pending request (requester self-correction) | `access_request.create` |
| `DELETE` | `/api/teams/:teamId/access-requests/:requestId` | Withdraw / delete pending request | `access_request.create` |
| `POST` | `/api/teams/:teamId/access-requests/:requestId/approve` | Approve request & atomically issue `AccessGrant` | `access_request.approve` |
| `POST` | `/api/teams/:teamId/access-requests/:requestId/reject` | Reject pending access request | `access_request.reject` |
| `DELETE` | `/api/teams/:teamId/access-requests/grants/:grantId` | Soft-revoke active direct grant | `access_request.approve` |

---

## 4. Database Models & Junction Schemas

| Model | Collection | Purpose / Key Indexes |
| :--- | :--- | :--- |
| **`User`** | `users` | Identity, email index (`unique`), password hash, account status enum. |
| **`Permission`** | `permissions` | Canonical permissions registry (`key` unique, category, resource, action). |
| **`Role`** | `roles` | Global role catalog (`name` unique, `isSystemRole`, `status`). |
| **`RolePermission`**| `role_permissions` | Junction linking `roleId` $\leftrightarrow$ `permissionId` (compound unique index). |
| **`Team`** | `teams` | Multi-tenant workspaces (`name` unique, `status`, `createdBy`). |
| **`Membership`** | `memberships` | User presence in team (`userId` + `teamId` compound unique index, `status`). |
| **`MembershipRole`**| `membership_roles` | Role assignment (`membershipId` + `roleId`, `assignedBy`, `expiresAt`, `revokedAt`). |
| **`Invitation`** | `invitations` | Workspace invite (`tokenHash` unique index, `teamId` + `email` + `status`, `roleIds`, `expiresAt`). |
| **`Task`** | `tasks` | Multi-tenant tasks (`teamId` + `status`, `teamId` + `assignedTo` compound indexes). |
| **`AccessRequest`**| `access_requests` | Elevation requests (`targetUserId` + `teamId` + `status` compound index, `expiresAt`). |
| **`AccessGrant`** | `access_grants` | Active direct grants (`userId` + `teamId` + `permissionId` + `resource` index, TTL). |

---

## 5. Automated Verification & Test Suites

> [!NOTE]
> Testing flow has been decoupled and removed for active development velocity. A comprehensive, unified test suite across all modules will be constructed upon complete feature implementation.

---

## 6. Current Focus: Phase 9 — Real-time WebSockets, Live Notifications & Team Chat Collaboration

- **Learning Module Document:** [`backend/implementation/learning-module/realtime.md`](file:///Users/kp/Desktop/task/team-management-system/backend/implementation/learning-module/realtime.md)

1. **Socket.IO Real-time Gateway**: Authenticated WebSocket connections with JWT handshake verification (`socket-auth.middleware.js` completed).
2. **Room & Channel Architecture**:
   - Workspace team channels (`team:<teamId>`) & private direct user inboxes (`user:<userId>`).
   - Team Discussion Channels (e.g. `#engineering-general`, `#releases`) with channel creation permissions (`channel.create`).
3. **Task Discussions & Comment Threads**: Live comment feed on tasks with moderation permissions (`task_comment.delete`).
4. **Direct Messaging (DMs)**: Real-time 1-on-1 developer messaging and status broadcasts.
5. **Live Event Dispatching**: Broadcast live task state mutations and pending access request alerts.



