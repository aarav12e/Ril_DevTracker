# DevTracker

Internal Developer Activity Tracking System for H.N. Reliance Hospital, Mumbai.

This project is split into two main parts:
- Backend: FastAPI-based REST API with SQLAlchemy, JWT auth, MySQL, and Excel upload support.
- Frontend: React + Vite + Tailwind interface for admins, developers, and managers.

---

## Repository Structure

```text
devtracker-backend/
├── README.md
├── .gitignore
├── backend/
│   ├── .gitignore
│   ├── alembic.ini
│   ├── main.py
│   ├── requirements.txt
│   ├── seed.py
│   ├── .env                  # local backend config (not committed)
│   └── app/
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   └── security.py
│       ├── models/
│       │   └── models.py
│       ├── routes/
│       │   ├── analytics.py
│       │   ├── auth.py
│       │   ├── config.py
│       │   ├── notifications.py
│       │   ├── tasks.py
│       │   ├── timer.py
│       │   ├── upload.py
│       │   └── users.py
│       ├── schemas/
│       │   └── schemas.py
│       └── services/
│           └── utils.py
└── frontend/
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/
        │   └── axios.js
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── layout/
        │   │   ├── Layout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   └── shared/
        │       ├── EmptyState.jsx
        │       ├── KpiCard.jsx
        │       └── LoadingSpinner.jsx
        │   └── task/
        │       ├── LiveTimer.jsx
        │       ├── QuickAddForm.jsx
        │       └── TaskCard.jsx
        ├── constants/
        │   └── index.js
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── admin/
        │   │   ├── AdminDashboard.jsx
        │   │   ├── AdminLogs.jsx
        │   │   ├── ExcelUpload.jsx
        │   │   ├── Reports.jsx
        │   │   └── RoleConfig.jsx
        │   ├── auth/
        │   │   └── Login.jsx
        │   └── dev/
        │       ├── DevDashboard.jsx
        │       ├── LogEntryForm.jsx
        │       └── MyLogs.jsx
        └── utils/
            └── badges.jsx
```

---

## Backend Structure

### Main backend entry points
- [backend/main.py](backend/main.py): Starts the FastAPI application.
- [backend/seed.py](backend/seed.py): Seeds initial users, roles, and demo data.
- [backend/requirements.txt](backend/requirements.txt): Python dependencies for the API.
- [backend/alembic.ini](backend/alembic.ini): Alembic configuration for database migrations.

### Backend application modules
- [backend/app/core](backend/app/core): Core app configuration and infrastructure.
  - [backend/app/core/config.py](backend/app/core/config.py): Reads environment variables and app settings.
  - [backend/app/core/database.py](backend/app/core/database.py): SQLAlchemy engine, session factory, and base model setup.
  - [backend/app/core/security.py](backend/app/core/security.py): JWT, password hashing, and role-based access helpers.
- [backend/app/models](backend/app/models): SQLAlchemy database models.
  - [backend/app/models/models.py](backend/app/models/models.py): Tables for users, tasks, logs, timers, and related entities.
- [backend/app/schemas](backend/app/schemas): Pydantic request/response schemas.
  - [backend/app/schemas/schemas.py](backend/app/schemas/schemas.py): Validation models for API payloads.
- [backend/app/routes](backend/app/routes): API route handlers grouped by feature.
  - [backend/app/routes/auth.py](backend/app/routes/auth.py): Login, registration, and authentication endpoints.
  - [backend/app/routes/users.py](backend/app/routes/users.py): User management endpoints.
  - [backend/app/routes/tasks.py](backend/app/routes/tasks.py): Task CRUD and task-related operations.
  - [backend/app/routes/timer.py](backend/app/routes/timer.py): Timer start, pause, resume, complete, and switch flows.
  - [backend/app/routes/upload.py](backend/app/routes/upload.py): Excel upload and validation endpoints.
  - [backend/app/routes/analytics.py](backend/app/routes/analytics.py): Dashboard and analytics data endpoints.
  - [backend/app/routes/notifications.py](backend/app/routes/notifications.py): Notification-related endpoints.
  - [backend/app/routes/config.py](backend/app/routes/config.py): Configuration and export-related endpoints.
- [backend/app/services](backend/app/services): Helper and utility logic.
  - [backend/app/services/utils.py](backend/app/services/utils.py): Ticket generation, admin notifications, and shared helper functions.

---

## Frontend Structure

### Main frontend entry points
- [frontend/index.html](frontend/index.html): HTML shell for the Vite app.
- [frontend/package.json](frontend/package.json): Frontend scripts and dependencies.
- [frontend/vite.config.js](frontend/vite.config.js): Vite development and build configuration.
- [frontend/tailwind.config.js](frontend/tailwind.config.js): Tailwind styling configuration.

### Frontend source folders
- [frontend/src](frontend/src): Main application source code.
  - [frontend/src/main.jsx](frontend/src/main.jsx): App bootstrap.
  - [frontend/src/App.jsx](frontend/src/App.jsx): Main route and app shell.
  - [frontend/src/index.css](frontend/src/index.css): Global styles and Tailwind base styles.
  - [frontend/src/api](frontend/src/api): API client setup.
    - [frontend/src/api/axios.js](frontend/src/api/axios.js): Axios instance with auth handling.
  - [frontend/src/components](frontend/src/components): Reusable UI pieces.
    - [frontend/src/components/layout](frontend/src/components/layout): Sidebar, topbar, and layout wrappers.
    - [frontend/src/components/shared](frontend/src/components/shared): Shared cards, empty states, and loading indicators.
    - [frontend/src/components/task](frontend/src/components/task): Task-related UI widgets such as timer and quick add form.
  - [frontend/src/context](frontend/src/context): Shared React context.
    - [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx): Authentication state and login/session handling.
  - [frontend/src/pages](frontend/src/pages): Feature pages by role.
    - [frontend/src/pages/auth/Login.jsx](frontend/src/pages/auth/Login.jsx): Login page.
    - [frontend/src/pages/admin](frontend/src/pages/admin): Admin dashboard, reports, user management, logs, and upload pages.
    - [frontend/src/pages/dev](frontend/src/pages/dev): Developer-facing dashboards and log pages.
  - [frontend/src/utils](frontend/src/utils): Helpers for badges and UI utilities.
    - [frontend/src/utils/badges.jsx](frontend/src/utils/badges.jsx): Badge rendering helpers.
  - [frontend/src/constants](frontend/src/constants): Shared constants and static data.
    - [frontend/src/constants/index.js](frontend/src/constants/index.js): Central constants file.

---

## Backend Setup

### 1. Enter the backend folder
```bash
cd backend
```

### 2. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Create a local [.env](backend/.env) file inside [backend](backend) with values such as:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=devtracker
DB_USER=root
DB_PASSWORD=your_password_here
SECRET_KEY=your-long-secret-key
```

### 5. Create the database
```sql
CREATE DATABASE devtracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Create tables and seed data
```bash
python -c "from app.core.database import Base, engine; import app.models.models; Base.metadata.create_all(bind=engine); print('Tables created!')"
python seed.py
```

### 7. Run the backend
```bash
uvicorn main:app --reload
```

The API will be available at:
- http://localhost:8000
- Swagger docs: http://localhost:8000/docs

---

## Frontend Setup

### 1. Enter the frontend folder
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

The frontend should open on the Vite local URL shown in the terminal.

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin_raj | Admin@1234 |
| Developer | priya_dev | Dev@1234 |
| Developer | dev_karan | Dev@1234 |
| Manager | mgr_sneha | Dev@1234 |
| Intern | arjun_intern | Dev@1234 |

---

## Key API Endpoints

### Auth
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Tasks
- GET /api/tasks
- GET /api/tasks/my
- POST /api/tasks
- PATCH /api/tasks/{id}

### Timer
- POST /api/timer/start/{task_id}
- POST /api/timer/pause/{task_id}
- POST /api/timer/resume/{task_id}
- POST /api/timer/complete/{task_id}
- POST /api/timer/switch/{task_id}
- GET /api/timer/active/me

### Upload
- POST /api/upload/excel
- GET /api/upload/validate
- GET /api/upload/template
- GET /api/upload/history

### Analytics
- GET /api/analytics/dashboard/me
- GET /api/analytics/dashboard/admin
- GET /api/analytics/reports

### Export
- GET /api/config/export/excel
- GET /api/config/export/csv

---

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- MySQL + PyMySQL
- Pydantic
- Python-JOSE for JWT
- Passlib + bcrypt
- Pandas + openpyxl
- Alembic

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router-style page structure


to start the backend

cd /Users/aarav/Desktop/Project/devtracker-backend/backend
source venv/bin/activate
uvicorn main:app --reload
