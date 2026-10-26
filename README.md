# ProjectDesk

**Student Project Lifecycle Management Platform**
*From Proposal to Final Evaluation.*

ProjectDesk centralizes the complete project workflow between faculty and students — project creation, team formation, title allocation, approvals and status monitoring — in one professional platform. Built with the MERN stack.

---

# Faculty Credential Details

| Faculty | Email | Password | Role |
|---|---|---|---|
| Faculty 01 | faculty01@projectdesk.dev | Faculty@123 | Faculty |
| Faculty 02 | faculty02@projectdesk.dev | Faculty@456 | Faculty |
| Faculty 03 | faculty03@projectdesk.dev | Faculty@789 | Faculty |
| Faculty 04 | faculty04@projectdesk.dev | Faculty@321 | Faculty |
| Faculty 05 | faculty05@projectdesk.dev | Faculty@654 | Faculty |

> **Note:** These are development/demo credentials for the ProjectDesk application. Change the passwords before production deployment.

---

---

## ✨ Features

### Faculty Portal
- **Dashboard** — Bento-style overview with real aggregates: total projects, teams, pending approvals, active projects, team status distribution.
- **Create Project** — Project name, max team members (2–10), end date, instructions, optional instructions PDF (Cloudinary), dynamic add/remove project titles with duplicate protection, staged creation animation, and a success card with a copyable `PD-PRJ-XXXXXXXX` ID.
- **Projects** — Search (name/ID), status filter, per-project stats.
- **Teams** — Search by team name, code, title or project; status filters; member counts.
- **Approvals** — Pending queue with Approve / Reject / Request Changes (remarks required, members notified).
- **Monitoring** — Title allocation and review progress per project.

### Student Portal
- **Dashboard** — Project, team, title, approval status, members, end date.
- **Access Project** — Enter a Project ID (validated on the backend) to view details, instructions, PDF and titles.
- **Create Team** — Team name, logo upload, problem statement, proposed solution, and selection of an AVAILABLE title (first-come, first-served with atomic allocation), staged animation + `PD-TEAM-XXXXXX` success card.
- **Join Team** — Team-code join with backend validation: team exists → project active → not ended → capacity → no duplicate membership.
- **My Team / Project Status** — Full team view and approval timeline with faculty remarks.

### Platform
- JWT auth with bcrypt hashing, role-based authorization (student/faculty), portal separation.
- Socket.IO live notifications (MongoDB remains the source of truth).
- 10 UI states: empty, loading (skeleton+shimmer), error, no internet, slow network, no search results, permission denied, session expired, form validation, success.
- Responsive: desktop sidebar ↔ mobile drawer, bento grids that stack, mobile-friendly modals.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Framer Motion, Lucide |
| Backend | Node.js, Express, JWT, bcryptjs, express-validator, Multer, Socket.IO |
| Database | MongoDB + Mongoose (Atlas compatible) |
| Files | Cloudinary (local disk fallback when not configured) |

## 📁 Structure

```
ProjectDesk/
├── client/          # React + Vite SPA
│   └── src/{components,layouts,pages/{auth,student,faculty,shared},routes,services,context,hooks,utils}
├── server/          # Express API
│   └── src/{config,controllers,middleware,models,routes,services,validators,utils,tests}
├── .env.example     # All required environment variables
├── vercel.json      # Frontend deploy config
└── render.yaml      # Backend deploy blueprint
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local **replica set** or Atlas) — transactions need replica-set support. Atlas works out of the box; for local MongoDB start `mongod --replSet rs0` and run `rs.initiate()` once.

### 1. Clone and install
```bash
npm install                # root tooling (concurrently)
npm run install:all        # server + client dependencies
```

### 2. Configure environment
```bash
cp .env.example .env
# then edit .env:
# MONGO_URI=mongodb://127.0.0.1:27017/projectdesk  (or your Atlas URI)
# JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
# CLIENT_ORIGIN=http://localhost:5173
# CLOUDINARY_*  (optional — empty = local disk uploads at /uploads)
```

### 3. Seed faculty accounts (creates the 5 authorized faculty logins)
```bash
npm run seed
# Creates faculty01–faculty05 (see Faculty Credential Details above).
# Idempotent — safe to run repeatedly; never duplicates or overwrites.
# NOTE: creates NO demo projects/teams — the Faculty Portal starts clean.
```

### Maintenance commands
```bash
npm run clean   # wipe ALL workflow data (projects, titles, teams, members,
                # approvals, notifications) while preserving all user accounts
                # and re-ensuring the 5 faculty logins
npm run reset   # clean + seed — one command to a fresh, clean portal
npm run verify  # 13 auth/registration checks against the running app
npm run verify:faculty  # 42 checks: all 5 faculty logins, clean dashboards,
                # role protection
```

### 4. Run
```bash
npm run dev      # API on :5000 + client on :5173 (proxied)
```

### 5. Test
```bash
npm test         # 46 API tests — auth, roles, IDs, concurrency, capacity, approvals
```

---

## 🔌 API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | public (students) |
| POST | `/api/auth/login` | public (role-aware) |
| GET | `/api/auth/me` | authenticated |
| POST | `/api/projects` | faculty |
| GET | `/api/projects` | faculty |
| GET | `/api/projects/:id` | faculty (owner) |
| PATCH | `/api/projects/:id/status` | faculty (owner) |
| GET | `/api/projects/access/:projectId` | student |
| GET | `/api/projects/:id/titles` | faculty (owner) |
| POST | `/api/teams` | student |
| POST | `/api/teams/join` | student |
| GET | `/api/teams/mine` | student |
| GET | `/api/teams` | faculty |
| GET | `/api/teams/:teamCode` | member or project faculty |
| GET | `/api/teams/:id/detail` | member or project faculty |
| PATCH | `/api/teams/:teamId/approval` | faculty (owner) |
| GET | `/api/approvals` | faculty |
| GET | `/api/dashboard/faculty` · `/api/dashboard/student` | role-scoped |
| GET/PATCH | `/api/notifications(/:id/read)` | authenticated |
| GET | `/api/health` | public |

Errors are centralized: `400` validation · `401` auth/expired · `403` permission · `404` not found · `409` conflict (full team, duplicate membership, title taken, duplicate review) · `500` safe generic. Raw database errors are never exposed.

## 🛡️ Business Rules (backend-enforced)

1. One title → max one team. Allocation uses a conditional atomic update (`AVAILABLE → ASSIGNED`) inside a transaction; concurrent attempts yield a single winner and `409` for losers.
2. One student → max one team per project (checked + unique compound index `{projectId, userId}`).
3. Team size capped at the faculty-defined maximum (re-validated inside the join transaction).
4. Project IDs and Team Codes are generated **only** on the backend, uniqueness-checked against MongoDB and backed by unique indexes. Safe charset: `ABCDEFGHJKLMNPQRSTUVWXYZ2346789` (no O/0, I/1).
5. Students cannot modify faculty-defined limits — the API ignores client-sent values entirely.
6. Only the project's faculty can review its teams; remarks are mandatory for change requests; rejecting a team releases its title.

## ☁️ Deployment

**Frontend (Vercel):** import the repo, root `client/`, build `npm run build`, output `dist/`. Set `VITE_API_URL` to your API base and `VITE_SOCKET_URL` to the API origin.

**Backend (Render/Railway):** uses `render.yaml` (root `server/`). Set `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_ORIGIN` (Vercel URL), `SERVER_URL` (public API URL — used for local-file upload links) and the three Cloudinary keys (recommended in production).

**Database:** MongoDB Atlas recommended. Create the cluster, copy the connection string into `MONGO_URI`.

## 🧪 Manual Test Script (demo-ready)

1. Faculty login → `faculty01@projectdesk.dev / Faculty@123` → Create Project → success card shows `PD-PRJ-…`.
2. Copy the Project ID → log out.
3. Student register (`/student/register`) → enter Project ID → Create Team (select an available title) → Team Code card.
4. Second student → register → Join Team with the Team Code.
5. Third student tries the same code after the team is full → "Team is already full."
6. Faculty → Approvals → Approve / Request Changes (remarks) / Reject → students get notifications.
7. Student → Project Status shows the timeline with remarks.
