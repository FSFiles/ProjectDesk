# ProjectDesk

**Student Project Lifecycle Management Platform**
*From Proposal to Final Evaluation.*

ProjectDesk centralizes the complete project workflow between faculty and students — project creation, team formation, title allocation, approvals and status monitoring — in one professional platform. Built with the MERN stack.

---

## ✨ Features

### Faculty Portal

* **Dashboard** — Bento-style overview with real aggregates: total projects, teams, pending approvals, active projects, and team status distribution.
* **Create Project** — Project name, maximum team members (2–10), end date, instructions, optional instructions PDF (Cloudinary), dynamic add/remove project titles with duplicate protection, staged creation animation, and a success card with a copyable `PD-PRJ-XXXXXXXX` ID.
* **Projects** — Search by name or ID, status filters, and per-project statistics.
* **Teams** — Search by team name, code, title, or project; status filters; member counts.
* **Approvals** — Pending queue with Approve, Reject, and Request Changes options. Remarks are required for change requests, and members are notified.
* **Monitoring** — Title allocation and review progress per project.

### Student Portal

* **Dashboard** — Project, team, title, approval status, members, and end date.
* **Access Project** — Enter a Project ID validated by the backend to view details, instructions, PDFs, and titles.
* **Create Team** — Team name, logo upload, problem statement, proposed solution, and selection of an available title. Titles are allocated on a first-come, first-served basis with atomic allocation. Includes a staged animation and `PD-TEAM-XXXXXX` success card.
* **Join Team** — Team-code joining with backend validation for team existence, project activity, end date, capacity, and duplicate membership.
* **My Team / Project Status** — Full team view and approval timeline with faculty remarks.

### Platform

* JWT authentication with bcrypt password hashing.
* Role-based authorization for students and faculty.
* Separate student and faculty portals.
* Socket.IO live notifications, with MongoDB remaining the source of truth.
* Ten UI states: empty, loading (skeleton and shimmer), error, no internet, slow network, no search results, permission denied, session expired, form validation, and success.
* Responsive design with desktop sidebar and mobile drawer layouts, bento grids that stack, and mobile-friendly modals.

---

## 🧱 Tech Stack

| Layer        | Technology                                                            |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | React 18, Vite, Tailwind CSS, React Router, Framer Motion, Lucide     |
| Backend      | Node.js, Express, JWT, bcryptjs, express-validator, Multer, Socket.IO |
| Database     | MongoDB + Mongoose (Atlas compatible)                                 |
| File Storage | Cloudinary, with local disk fallback when not configured              |

---

## 📁 Project Structure

```text
ProjectDesk/
├── client/          # React + Vite SPA
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       │   ├── auth/
│       │   ├── student/
│       │   ├── faculty/
│       │   └── shared/
│       ├── routes/
│       ├── services/
│       ├── context/
│       ├── hooks/
│       └── utils/
├── server/          # Express API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── utils/
│       └── tests/
├── scripts/
├── .env.example     # Environment variable template
├── package.json
├── vercel.json      # Frontend deployment configuration
└── render.yaml      # Backend deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18 or later
* MongoDB running locally as a replica set, or MongoDB Atlas
* npm

**Note:** MongoDB transactions require replica-set support. MongoDB Atlas supports this. For local MongoDB, configure a replica set, start MongoDB with `mongod --replSet rs0`, and run `rs.initiate()` once.

### 1. Clone the Repository

```bash
git clone https://github.com/FSFiles/ProjectDesk.git
cd ProjectDesk
```

### 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Install the server and client dependencies using the project's installation script:

```bash
npm run install:all
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows Command Prompt, you can use:

```cmd
copy .env.example .env
```

Open `.env` and configure the required environment variables.

Example configuration:

```env
MONGO_URI=mongodb://127.0.0.1:27017/projectdesk
JWT_SECRET=your_generated_secret
CLIENT_ORIGIN=http://localhost:5173
```

For MongoDB Atlas, replace the local MongoDB URI with your Atlas connection string.

Generate a secure JWT secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Configure the Cloudinary environment variables if cloud-based file storage is required. If Cloudinary is not configured, the application can use its local disk fallback where supported.

**Security:** Never commit `.env` or publish actual passwords, API keys, database credentials, or JWT secrets.

### 4. Seed Faculty Accounts

Run:

```bash
npm run seed
```

This creates the five authorized development faculty accounts.

The seed operation is designed to be idempotent. It does not create duplicate accounts or overwrite existing accounts.

No demo projects or teams are created, so the Faculty Portal starts with a clean workflow.

Configure or retrieve development login credentials through your local development setup. Do not publish passwords in this repository.

### 5. Run the Application

Start the frontend and backend development servers:

```bash
npm run dev
```

The application uses the following development ports:

| Service     | Address                 |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |

The frontend communicates with the backend through the configured development proxy.

### 6. Run Tests

Run the API tests:

```bash
npm test
```

The project's test suite covers authentication, authorization, project IDs, concurrency, team capacity, approvals, and related API behavior.

---

## 🛠️ Maintenance Commands

The following commands are available through the root npm scripts:

| Command                  | Description                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `npm run clean`          | Clears workflow data while preserving user accounts and re-ensuring faculty accounts. |
| `npm run reset`          | Runs the clean and seed operations to restore a clean portal.                         |
| `npm run verify`         | Runs authentication and registration verification checks.                             |
| `npm run verify:faculty` | Verifies faculty login, dashboard behavior, and role protection.                      |

**Warning:** The `clean` and `reset` commands can delete workflow data. Use them only in the intended development or test environment.

---

## 🔌 API Overview

| Method    | Endpoint                          | Access                         |
| --------- | --------------------------------- | ------------------------------ |
| POST      | `/api/auth/register`              | Public — students              |
| POST      | `/api/auth/login`                 | Public — role-aware login      |
| GET       | `/api/auth/me`                    | Authenticated                  |
| POST      | `/api/projects`                   | Faculty                        |
| GET       | `/api/projects`                   | Faculty                        |
| GET       | `/api/projects/:id`               | Project owner                  |
| PATCH     | `/api/projects/:id/status`        | Project owner                  |
| GET       | `/api/projects/access/:projectId` | Student                        |
| GET       | `/api/projects/:id/titles`        | Project owner                  |
| POST      | `/api/teams`                      | Student                        |
| POST      | `/api/teams/join`                 | Student                        |
| GET       | `/api/teams/mine`                 | Student                        |
| GET       | `/api/teams`                      | Faculty                        |
| GET       | `/api/teams/:teamCode`            | Team member or project faculty |
| GET       | `/api/teams/:id/detail`           | Team member or project faculty |
| PATCH     | `/api/teams/:teamId/approval`     | Project faculty                |
| GET       | `/api/approvals`                  | Faculty                        |
| GET       | `/api/dashboard/faculty`          | Faculty                        |
| GET       | `/api/dashboard/student`          | Student                        |
| GET/PATCH | `/api/notifications(/:id/read)`   | Authenticated                  |
| GET       | `/api/health`                     | Public                         |

### Error Handling

The backend centralizes API error handling.

| Status Code | Meaning                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `400`       | Validation error                                                          |
| `401`       | Authentication required or session expired                                |
| `403`       | Permission denied                                                         |
| `404`       | Resource not found                                                        |
| `409`       | Conflict, such as a full team, duplicate membership, or unavailable title |
| `500`       | Internal server error                                                     |

Raw database errors are not intentionally exposed to clients.

---

## 🛡️ Backend-Enforced Business Rules

1. **Unique title allocation:** Each project title can be assigned to at most one team. Allocation uses a conditional atomic update from `AVAILABLE` to `ASSIGNED` inside a transaction. Concurrent attempts should produce one winner, with conflicting attempts rejected.
2. **One team per student per project:** A student can belong to at most one team per project. Membership is checked and supported by a unique compound index on `{projectId, userId}`.
3. **Team capacity:** The maximum team size is defined by faculty and revalidated inside the join transaction.
4. **Unique project IDs and team codes:** Identifiers are generated on the backend and checked against MongoDB, with unique indexes enforcing uniqueness.
5. **Server-controlled limits:** Students cannot modify faculty-defined project or team limits by submitting client-controlled values.
6. **Faculty review permissions:** Only the faculty member responsible for a project can review its teams.
7. **Required remarks:** Remarks are mandatory when requesting changes.
8. **Title release:** Rejecting a team releases its allocated title according to the application's workflow rules.

### Identifier Format

* Project ID: `PD-PRJ-XXXXXXXX`
* Team Code: `PD-TEAM-XXXXXX`

The identifier generator uses a restricted character set intended to avoid visually ambiguous characters.

---

## ☁️ Deployment

### Frontend — Vercel

The frontend can be deployed using Vercel.

Recommended configuration:

* **Root directory:** `client`
* **Build command:** `npm run build`
* **Output directory:** `dist`

Configure the following environment variables as appropriate for the application:

* `VITE_API_URL` — Public backend API base URL.
* `VITE_SOCKET_URL` — Backend origin used for Socket.IO connections.

Confirm that the frontend environment variable names match those referenced in the client code.

### Backend — Render or Railway

The backend can be deployed to Render or Railway.

The repository includes a `render.yaml` deployment configuration. Review its service settings before deployment.

Configure the following environment variables in the hosting provider:

* `MONGO_URI` — MongoDB Atlas connection string.
* `JWT_SECRET` — Secure, randomly generated secret.
* `CLIENT_ORIGIN` — Deployed frontend URL.
* `SERVER_URL` — Public backend URL, used for local-file upload links where applicable.
* Cloudinary credentials, if cloud-based file storage is enabled.

Never place production secrets directly in deployment configuration files or source code.

### Database — MongoDB Atlas

MongoDB Atlas is recommended for production deployment.

1. Create a MongoDB Atlas cluster.
2. Configure database access and network access restrictions.
3. Obtain the connection string.
4. Set it as `MONGO_URI` in the backend deployment environment.
5. Verify that the backend can connect to the database.

---

## 🧪 Manual Testing Workflow

Use authorized development accounts and test data in a local or designated test environment.

1. Log in through the faculty portal.
2. Create a project and note its generated Project ID.
3. Sign out and register a student account.
4. Access the project using the Project ID.
5. Create a team and select an available project title.
6. Register another student and join the team using its Team Code.
7. Test team capacity by attempting to add another member after the maximum size is reached.
8. Log in as the project's faculty member.
9. Open the approvals queue and test Approve, Request Changes, and Reject.
10. Verify that students receive the expected notifications and can view the approval timeline and faculty remarks.
11. Test role-based access restrictions and validation failures.

---

## 🔐 Security Notes

* Never commit `.env` files or production secrets.
* Do not store actual passwords or private login credentials in README files.
* Use strong, unique secrets for JWT signing.
* Use HTTPS in production.
* Restrict database access and configure deployment environment variables securely.
* Keep dependencies updated and review security advisories.
* Use only authorized accounts when testing the application.

---

## 📄 License

A license has not yet been specified. Add an appropriate `LICENSE` file before distributing the project under an open-source license.


# Faculty Credential Details

| Faculty | Email | Password | Role |
|---|---|---|---|
| Faculty 01 | faculty01@projectdesk.dev | Faculty@123 | Faculty |
| Faculty 02 | faculty02@projectdesk.dev | Faculty@456 | Faculty |
| Faculty 03 | faculty03@projectdesk.dev | Faculty@789 | Faculty |
| Faculty 04 | faculty04@projectdesk.dev | Faculty@321 | Faculty |
| Faculty 05 | faculty05@projectdesk.dev | Faculty@654 | Faculty |
