# TaskFlow – Task Management Application

> **"Organize. Track. Complete."**  
> A professional, full-stack task management web application built for internship Task 2.

## 🌐 Demo

Live Demo: [YOUR_DEMO_LINK_HERE](https://task-2-task-management-application.onrender.com/)
---

## 📌 Project Overview

**TaskFlow** is an enterprise-grade full-stack task management application engineered with a modern TypeScript stack, clean architecture, and strict security standards. The application enables users to register, authenticate securely via JSON Web Tokens (JWT), manage tasks through complete CRUD operations, monitor deliverables via dynamic metrics, and collaborate with real-time WebSocket state synchronization.

Data integrity is backed by a relational **MySQL 8.0** schema with foreign key constraints, indexing for high-frequency queries, and per-user tenant isolation to prevent unauthorized cross-account access.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration**: Multi-field validation, RFC-compliant email checking, minimum password length enforcement, password confirmation matching, and duplicate email prevention.
- **Secure Password Hashing**: Passwords encrypted using **bcrypt** (salt rounds = 10); plain-text credentials are never persisted or returned.
- **JWT Authentication**: Token-based stateless authentication with expiration handling.
- **Route & Data Protection**: Express authorization middleware enforces strict user isolation; tasks can only be accessed or modified by their creator.

### 📊 Professional Dashboard
- **Interactive Metric Cards**: Real-time counters for **Total Tasks**, **Pending**, **In Progress**, **Completed**, and **Overdue**. Clicking any summary card instantly filters tasks by that state.
- **Dual View Modes**:
  - **Structured List View**: Detailed cards highlighting category, due date proximity, priority indicator, and quick status controls.
  - **Kanban Board View**: 3-column workflow (Pending → In Progress → Completed) with lateral move shortcuts.
- **Dynamic Search, Filtering & Sorting**:
  - Real-time search across task titles and descriptions.
  - Multi-dimensional filters by status, priority level, and category.
  - Multi-criteria sorting: Due date (earliest/latest), priority (high to low), and creation date.

### 📝 Complete Task CRUD Operations
- **Create**: Modal dialog with title, description, status, priority, category, and due date with quick presets (Today, Tomorrow, Next Week).
- **Read**: Live database queries with search, filter, and sort parameters.
- **Update**: Edit full task details or trigger quick inline status transitions.
- **Delete**: Custom confirmation modal protecting against accidental deletions.

### ⚡ Real-Time Updates (WebSockets)
- Integrated WebSocket service (`/ws`) providing instant event propagation:
  - `task:created`
  - `task:updated`
  - `task:deleted`
- Automatic reconnection with exponential backoff and connection status indicator.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 (responsive desktop, tablet, and mobile layouts)
- **Icons**: Lucide React
- **Build Tool**: Vite 8

### Backend
- **Runtime**: Node.js v22 (ESM)
- **Framework**: Express.js
- **Language**: TypeScript (`tsx` execution)
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs`
- **Real-time**: WebSockets (`ws`)

### Database
- **Database Engine**: MySQL 8.0 (Relational SQL)
- **Driver**: `mysql2/promise` with connection pooling
- **Resilience Layer**: Built-in persistent relational engine ensuring zero setup blockers when running in sandboxed dev environments

---

## 📐 Architecture & Project Structure

```
task-management/
│
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Brand header, WebSocket status, database badge
│   │   ├── SummaryCards.tsx       # KPI metrics with interactive filter triggers
│   │   ├── FilterBar.tsx          # Search, category/status/priority filters, sort
│   │   ├── TaskCard.tsx           # Task card with unboxed metadata discipline
│   │   ├── KanbanBoard.tsx        # 3-column visual workflow
│   │   ├── TaskModal.tsx          # Task creation & editing modal with validation
│   │   ├── TaskDetailsModal.tsx   # Detailed task inspector
│   │   ├── DeleteConfirmModal.tsx # Permanent deletion confirmation
│   │   ├── DatabaseStatusBadge.tsx# Relational database inspector
│   │   └── Toast.tsx              # Transient toast feedback notifications
│   ├── pages/
│   │   ├── LoginPage.tsx          # Login form with demo credentials auto-fill
│   │   ├── RegisterPage.tsx       # Registration form with real-time feedback
│   │   └── DashboardPage.tsx      # Main authenticated dashboard
│   ├── services/
│   │   ├── api.ts                 # REST API client with Bearer token injection
│   │   └── websocket.ts           # Client WebSocket connection manager
│   ├── context/
│   │   └── AuthContext.tsx        # Global user authentication state
│   ├── types/
│   │   └── index.ts               # Core TypeScript domain interfaces
│   ├── utils/
│   │   └── formatters.ts          # Date & deadline calculation utilities
│   ├── App.tsx                    # Main app component & view router
│   ├── main.tsx                   # React DOM entry point
│   └── index.css                  # Global styles & Tailwind entry
│
├── server/
│   ├── routes/
│   │   ├── authRoutes.ts          # Authentication routes
│   │   └── taskRoutes.ts          # Protected task endpoints
│   ├── controllers/
│   │   ├── authController.ts      # Register, login, profile logic
│   │   └── taskController.ts      # Task CRUD operations & metrics computation
│   ├── middleware/
│   │   ├── authMiddleware.ts      # JWT verification & req.user extraction
│   │   └── validateMiddleware.ts  # Input sanitization & schema validation
│   ├── db/
│   │   └── database.ts            # MySQL 8.0 pool & persistent SQL store
│   ├── utils/
│   │   └── websocketServer.ts     # WebSocket server on /ws
│   └── server.ts                  # Express server & Vite integration entry
│
├── schema.sql                     # Production MySQL 8.0 schema & seed data
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # TypeScript compiler settings
├── vite.config.ts                 # Vite bundler configuration
└── README.md                      # Documentation
```

---

## 🗄 Database Design (`schema.sql`)

### Tables & Relationships

#### `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User login email (indexed) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| `created_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update time |

#### `tasks` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique task identifier |
| `user_id` | VARCHAR(36) | NOT NULL, FOREIGN KEY | Owner ID referencing `users(id)` |
| `title` | VARCHAR(255) | NOT NULL | Task title (indexed) |
| `description` | TEXT | NULL | Detailed notes / requirements |
| `status` | ENUM | NOT NULL DEFAULT 'Pending' | 'Pending', 'In Progress', 'Completed' |
| `priority` | ENUM | NOT NULL DEFAULT 'Medium' | 'Low', 'Medium', 'High' |
| `category` | VARCHAR(100)| NOT NULL DEFAULT 'General' | Work, Personal, Development, etc. |
| `due_date` | DATE | NULL | Target completion date (indexed) |
| `created_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Task creation time |
| `updated_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update time |

**Foreign Key Constraint**:
```sql
CONSTRAINT fk_tasks_user 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE
```

---

## 📡 REST API Documentation

### Base URL: `/api`

### 1. Authentication Endpoints

#### Register User
- **Method**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Account successfully registered.",
    "data": {
      "user": { "id": "usr_...", "name": "Jane Doe", "email": "jane@example.com" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### Login
- **Method**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": { "id": "usr_...", "name": "Jane Doe", "email": "jane@example.com" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### Current User Profile
- **Method**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "usr_...", "name": "Jane Doe", "email": "jane@example.com" }
    }
  }
  ```

---

### 2. Task Endpoints *(All require `Authorization: Bearer <token>`)*

| Method | Endpoint | Query / Body Params | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | `search`, `status`, `priority`, `category`, `sortBy`, `sortOrder` | List user's tasks and summary metrics |
| `GET` | `/api/tasks/:id` | Route param: `:id` | Retrieve specific task details |
| `POST`| `/api/tasks` | `{ title, description, status, priority, category, due_date }` | Create a new task |
| `PUT` | `/api/tasks/:id` | `{ title?, description?, status?, priority?, category?, due_date? }` | Update existing task |
| `DELETE` | `/api/tasks/:id` | Route param: `:id` | Delete a task |

---

### 3. System & Health Endpoint

- **Method**: `GET /api/health`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "status": "healthy",
    "app": "TaskFlow",
    "tagline": "Organize. Track. Complete.",
    "database": {
      "type": "MySQL 8.0",
      "connected": true,
      "host": "localhost:3306/task_management"
    }
  }
  ```

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **bun**
- **MySQL Server 8.0** (optional, fallback SQL store active automatically if MySQL is not running)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd taskflow
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
APP_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_management
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
```

### Step 3: Initialize Database (MySQL)
Run the migration script using MySQL CLI:
```bash
mysql -u root -p < schema.sql
```

### Step 4: Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Checklist

- [x] **Registration**: Valid input, duplicate email check, password confirmation matching.
- [x] **Authentication**: Valid login, invalid credentials rejection, session persistence.
- [x] **Authorization**: Cross-user boundary testing (user cannot access another user's task ID).
- [x] **Task Creation**: Required title, description, priority, category, due dates.
- [x] **Task Reading**: Filter by Status, Priority, Category; search query; sort order.
- [x] **Task Updating**: Edit title/notes, quick status transitions (Pending ↔ In Progress ↔ Completed).
- [x] **Task Deletion**: Confirmation dialog, permanent removal, metrics recalculation.
- [x] **Real-Time WebSockets**: Live sync between multiple tabs/windows.
- [x] **Health Check**: `GET /api/health` responding with 200 OK and database status.

---

## 🚀 Deploy to Render

This application must run as a Node.js web service so the frontend and `/api` routes are served from the same origin. The `render.yaml` blueprint builds the frontend and starts the Express server.

1. Push this repository to GitHub.
2. In Render, create a **New Blueprint Instance** and select the repository.
3. Wait for the service health check at `/api/health` to pass, then open the service URL.

The app seeds a demo account (`alex.turner@taskflow.dev` / `TaskFlow2026!`) when its database is empty. Without MySQL environment variables, it uses the local JSON file store, which may not persist across service restarts or redeploys on hosts with ephemeral disks. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` to use a persistent MySQL database for durable user and task data.

Do not deploy only the `dist` directory to a static host: that does not run the API, and sign-in will fail with a 404.

---

## 🌐 Demo

Live Demo: [YOUR_DEMO_LINK_HERE](https://task-2-task-management-application.onrender.com/)

---

## 👨‍💻 Developer Information

- **Project**: Internship Task 2 – Full-Stack Task Management Application
- **Author**: Internship Software Engineering Candidate
- **Application**: TaskFlow ("Organize. Track. Complete.")
