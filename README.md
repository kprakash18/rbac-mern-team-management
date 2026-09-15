# 🚀 NexusRBAC — Enterprise Multi-Tenant Team Management & Dynamic RBAC Platform

[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg?style=for-the-badge)](#)
[![Stack](https://img.shields.io/badge/Stack-React_19_%7C_Node.js_%7C_MongoDB_%7C_Redis-blue.svg?style=for-the-badge)](#)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO_%2B_Redis_Pub%2FSub-orange.svg?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](#)

> **A multi-tenant team management and security platform engineered around contextual Role-Based Access Control (RBAC), Just-In-Time (JIT) privilege elevation, distributed real-time state synchronization, and tamper-evident audit logging.**

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Advanced Engineering Highlights](#-advanced-engineering-highlights)
- [Core Feature Set](#-core-feature-set)
- [Data Modeling & Authorization Mechanics](#-data-modeling--authorization-mechanics)
- [Distributed Real-Time Engine](#-distributed-real-time-engine)
- [API Architecture & Documentation](#-api-architecture--documentation)
- [Local Setup & Development](#-local-setup--development)
- [Environment Configuration](#-environment-configuration)
- [Production Deployment](#-production-deployment)
- [Security Invariants & Design Trade-offs](#-security-invariants--design-trade-offs)

---

## 🏛️ Architecture Overview

NexusRBAC is architected as a modular, decoupled full-stack system designed for low-latency multi-tenant isolation, horizontal scalability, and predictable failure modes.

```text
                                  [ Client Layer ]
                               React 19 + Vite SPA
                             (TanStack Query Cache)
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼ (HTTPS / REST)                        ▼ (WSS / WebSockets)
        [ Express API Gateway ]                 [ Socket.IO Realtime Gateway ]
        ├── JWT Stateless Auth + Revocation     ├── Room Multiplexing
        ├── Contextual RBAC (authorize.js)      └── Server-Side Room Eviction
        └── Domain Services                                │
                   │                                       ▼
        ┌──────────┴──────────┐                 [ Redis Pub/Sub Adapter ]
        ▼                     ▼                 (Cross-Instance Sync)
 [ MongoDB Atlas ]     [ Upstash Redis ]                   ▲
 (ACID Persistence)    (Pub/Sub & Caching) ────────────────┘
```

---

## 🔬 Advanced Engineering Highlights

### 1. Dual-Model Fast-Path RBAC Evaluation
* **The Design Challenge:** Relational permission checking in NoSQL databases typically requires multi-collection joins (`User` $\rightarrow$ `Membership` $\rightarrow$ `MembershipRole` $\rightarrow$ `Role` $\rightarrow$ `Permission`) on every HTTP request, introducing latency and database contention under load.
* **The Implementation:** NexusRBAC utilizes a dual-model synchronization architecture:
  * **Fast-Path ($O(1)$ Lookups):** Effective `roleIds` are denormalized onto the parent `Membership` document, allowing middleware to evaluate active privileges in memory during request authentication.
  * **Relational Audit Trail:** Time-bound assignment metadata (`assignedBy`, `assignedAt`, `expiresAt`) is maintained within a dedicated `MembershipRole` junction collection with unique partial indexing (`{ membershipId: 1, roleId: 1, revokedAt: null }`).
  * **Atomic Synchronization:** Mutations across both collections are synchronized atomically to prevent authorization desynchronization.

### 2. Just-In-Time (JIT) Ephemeral Privilege Leases
* **Principle of Least Privilege:** Users operate with baseline roles and request elevated capabilities on demand for specific maintenance windows.
* **Automated TTL Expiration:** Access grants are modeled with state transitions (`PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `EXPIRED`) and strict `expiresAt` timestamps. Expired leases are filtered dynamically by the authorization layer without requiring continuous database delete polling.

### 3. Distributed WebSocket Multiplexing via Redis Pub/Sub
* **Horizontal Scalability:** Socket.IO instances are backed by an `@socket.io/redis-adapter`. Real-time notifications, chat broadcasts, and task mutations publish through Redis channels, ensuring messages reach connected clients regardless of which server instance hosts their TCP connection.
* **Zero-Trust Room Eviction:** When a member’s status is updated to `REMOVED` or `SUSPENDED`, the server invokes `io.in(user:<id>).socketsLeave(team:<id>)` to forcefully evict active sockets from private team rooms on the server side, mitigating client-side session tampering.

### 4. Hybrid Session Validation with Timestamp Revocation
* **Mitigating Stateless JWT Risks:** Standard JWTs remain valid until expiration even after logout. NexusRBAC tracks a `lastLogoutAt` timestamp on the user model. The `authenticate.js` middleware compares token issuance (`iat`) against `lastLogoutAt - 1000ms`, immediately invalidating stale tokens upon password change or logout.

### 5. Frontend Optimistic Concurrency & Dynamic Capability Metering
* **Optimistic UI with State Rollback:** Task transitions and role assignments apply optimistic updates directly to the TanStack Query cache, rolling back and displaying error alerts if backend validation fails.
* **Dynamic Permission Metering:** Dashboard capability counts (`capabilitiesCount / totalCapabilities`) are computed dynamically against the live permission catalog rather than relying on static frontend constants.

---

## 🛠️ Core Feature Set

* **Multi-Tenant Workspaces:** Complete data isolation between teams with workspace-scoped permissions, audit logs, and member rosters.
* **Granular Permission Catalog:** 39+ distinct capabilities covering user management, team operations, task workflows, and security governance.
* **Real-Time Workspace Chat:** Multi-channel messaging with Markdown parsing, sanitized rendering via DOMPurify, thread support, and unread badges.
* **Interactive Task Kanban:** Prioritized task boards with assignees, due dates, filterable status columns, and live socket sync.
* **Tamper-Evident Audit Logging:** Structured security events capturing actor identity, action type, target entity, and timestamp for compliance auditing.
* **Tokenized Email Invitations:** Automated invitation dispatch with SHA-256 token hashing and 1-hour expiration windows.

---

## 🔐 Data Model & Authorization Mechanics

```text
[ User ] ──────── (1:N) ────────► [ Membership ] ◄──────── (1:N) ──────── [ Team / Workspace ]
                                         │
                                  (1:N via Junction)
                                         ▼
                                [ MembershipRole ]
                                         │
                                       (N:1)
                                         ▼
                                     [ Role ]
                                         │
                                (N:M via Permission)
                                         ▼
                                   [ Permission ]
```

### Authorization Enforcement Hierarchy:
1. **Platform Super Admin Override:** Global bypass for platform maintenance and cross-tenant auditing.
2. **Context Resolution:** Extraction of target tenant from URL route parameters or `x-team-id` headers.
3. **Active Membership Verification:** Confirmation that the user holds an `ACTIVE` membership in the specified workspace.
4. **Capability Match:** Verification that the user’s assigned roles encompass the required permission key (e.g. `task.create`).

---

## 📡 API Architecture & Documentation

The backend adheres to RESTful semantics and provides an interactive OpenAPI / Swagger specification at `/api-docs`.

| Module | Method | Endpoint | Authorization Key |
| :--- | :---: | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/login` | Public |
| **Authentication** | `GET` | `/api/auth/me` | Authenticated Session |
| **Workspaces** | `GET` | `/api/teams` | Authenticated Session |
| **Workspaces** | `POST` | `/api/teams` | `team.create` |
| **Memberships** | `GET` | `/api/teams/:id/members` | `membership.read` |
| **Memberships** | `DELETE`| `/api/teams/:id/members/:id`| `membership.remove` |
| **RBAC** | `GET` | `/api/authorization/permissions`| Authenticated Session |
| **RBAC** | `POST` | `/api/teams/:id/members/:id/roles` | `role.assign` |
| **JIT Access** | `POST` | `/api/teams/:id/access-requests` | `access_request.create` |
| **Tasks** | `GET` | `/api/teams/:id/tasks` | `task.read` |
| **Tasks** | `POST` | `/api/teams/:id/tasks` | `task.create` |
| **Audit Logs** | `GET` | `/api/teams/:id/audit-logs` | `audit.read` |
| **Chat** | `GET` | `/api/teams/:id/channels` | Authenticated Member |

---

## 🚀 Local Setup & Development

### Prerequisites
* **Node.js:** `v20.x` or `v22.x`
* **MongoDB:** Local instance or MongoDB Atlas cluster
* **Redis:** Local Docker Redis or cloud Redis (Upstash)

### 1. Clone & Install
```bash
git clone https://github.com/kprakash18/rbac-mern-team-management.git
cd rbac-mern-team-management
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed:fresh     # Initializes permissions, roles, and administrative accounts
npm run dev            # Runs Express & Socket.IO server on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev            # Starts Vite development server on http://localhost:5173
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
```ini
NODE_ENV=development
PORT=8000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexus_rbac?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173

# SMTP Gateway
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="NexusRBAC <your_email@gmail.com>"

# Redis Pub/Sub
REDIS_URL=rediss://default:<password>@<host>:6379
UPSTASH_REDIS_REST_URL=https://<host>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:8000
```

---

## 🌐 Production Deployment

### Frontend $\rightarrow$ [Vercel](https://vercel.com)
* **Root Directory:** `frontend`
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variable:** `VITE_API_URL = https://<your-backend>.onrender.com`

### Backend $\rightarrow$ [Render](https://render.com)
* **Root Directory:** `backend`
* **Runtime:** `Node`
* **Build Command:** `npm install`
* **Start Command:** `node src/server.js`
* **Environment Variables:** Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `SMTP_*`, and `REDIS_URL`.

---

## 🛡️ Security Invariants & Design Trade-offs

| Invariant / Mechanism | Engineering Decision & Rationale |
| :--- | :--- |
| **Strict Multi-Tenant Scoping** | All resource queries mandate `{ teamId, _id }` filters to prevent Insecure Direct Object References (IDOR). |
| **Last Admin Guard** | `assertNotLastAdmin` blocks suspension or role revocation if the target is the sole administrator in the workspace. |
| **CORS Origin Validation** | Dynamic origin checking permits credentials while enforcing explicit whitelists in production. |
| **Bounded Listing Queries** | Query filters enforce hard ceilings (`?limit=100`) to protect Node.js heap memory from unbounded allocations. |
| **XSS Defense in Chat** | Markdown rendered in chat channels is sanitized through DOMPurify with whitelisted HTML tags. |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
