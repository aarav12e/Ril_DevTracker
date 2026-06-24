# DevTracker Backend — FastAPI

Internal Developer Activity Tracking System
H.N. Reliance Hospital, Mumbai

---

## Project Structure

```
devtracker-backend/
├── main.py                    ← FastAPI app entry point
├── seed.py                    ← Database seeder (run once)
├── requirements.txt
├── .env                       ← Your config (don't commit this)
├── alembic.ini
└── app/
    ├── core/
    │   ├── config.py          ← Settings from .env
    │   ├── database.py        ← SQLAlchemy engine + session
    │   └── security.py        ← JWT + password + role guards
    ├── models/
    │   └── models.py          ← All SQLAlchemy table models
    ├── schemas/
    │   └── schemas.py         ← All Pydantic request/response schemas
    ├── routes/
    │   ├── auth.py            ← POST /api/auth/login, /register
    │   ├── users.py           ← CRUD /api/users
    │   ├── tasks.py           ← CRUD /api/tasks
    │   ├── timer.py           ← /api/timer/start|pause|resume|complete|switch
    │   ├── upload.py          ← POST /api/upload/excel
    │   ├── analytics.py       ← /api/analytics/dashboard/me|admin
    │   ├── notifications.py   ← /api/notifications
    │   └── config.py          ← /api/config/roles, export excel/csv
    └── services/
        └── utils.py           ← Ticket generator, notify_admins, helpers
```

---

## Setup (Step by Step)

### 1. Clone and enter folder
```bash
cd devtracker-backend
```

### 2. Create virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure .env
Edit `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=devtracker
DB_USER=root
DB_PASSWORD=your_password_here
SECRET_KEY=any-long-random-string-here
```

### 5. Create MySQL database
Open MySQL and run:
```sql
CREATE DATABASE devtracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Create all tables
```bash
python -c "from app.core.database import Base, engine; import app.models.models; Base.metadata.create_all(bind=engine); print('Tables created!')"
```

### 7. Seed default data
```bash
python seed.py
```

### 8. Run the server
```bash
uvicorn main:app --reload
```

Server runs at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

---

## Default Login Credentials

| Role      | Username     | Password   |
|-----------|-------------|------------|
| Admin     | admin_raj   | Admin@1234 |
| Developer | priya_dev   | Dev@1234   |
| Developer | dev_karan   | Dev@1234   |
| Manager   | mgr_sneha   | Dev@1234   |
| Intern    | arjun_intern| Dev@1234   |

---

## Key API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/login | Login, get JWT token |
| POST | /api/auth/register | Register new user |
| GET  | /api/auth/me | Get current user info |

### Tasks
| Method | URL | Description |
|--------|-----|-------------|
| GET  | /api/tasks | List tasks (scoped by role) |
| GET  | /api/tasks/my | My tasks only |
| POST | /api/tasks | Create task (auto-generates DT-XXXXX ticket) |
| PATCH| /api/tasks/{id} | Update task |

### Timer
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/timer/start/{task_id} | Start timer |
| POST | /api/timer/pause/{task_id} | Pause timer |
| POST | /api/timer/resume/{task_id} | Resume timer |
| POST | /api/timer/complete/{task_id} | Mark complete |
| POST | /api/timer/switch/{task_id} | Switch to this task (pauses current) |
| GET  | /api/timer/active/me | Get my currently active task |

### Upload
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/upload/excel | Upload .xlsx file |
| GET  | /api/upload/validate | Dry-run validate without importing |
| GET  | /api/upload/template | Download blank template |
| GET  | /api/upload/history | Upload history |

### Analytics
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/analytics/dashboard/me | Developer personal dashboard data |
| GET | /api/analytics/dashboard/admin | Admin full analytics |
| GET | /api/analytics/reports | Filtered report data |

### Export
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/config/export/excel | Export filtered data as .xlsx |
| GET | /api/config/export/csv | Export filtered data as .csv |

---

## Tech Stack
- FastAPI 0.111
- SQLAlchemy 2.0 (ORM)
- MySQL + PyMySQL
- Pydantic v2 (validation)
- python-jose (JWT)
- passlib + bcrypt (password hashing)
- pandas + openpyxl (Excel processing)
- Alembic (migrations)
