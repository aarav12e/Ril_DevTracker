# DevTracker Frontend — React

Internal Developer Activity Tracking System
H.N. Reliance Hospital, Mumbai

---

## Setup

```bash
# 1. Enter folder
cd devtracker-frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

App runs at: **http://localhost:5173**

Make sure backend is running at: http://localhost:8000

---

## Pages

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Everyone |
| `/admin` | Admin Dashboard | Admin, Manager |
| `/admin/logs` | All Logs | Admin, Manager |
| `/admin/users` | Developer Management | Admin, Manager |
| `/admin/upload` | Excel Upload | Admin, Manager |
| `/admin/reports` | Reports & Export | Admin, Manager |
| `/admin/config` | Role & Domain Config | Admin only |
| `/dev` | Developer Dashboard | Developer, Intern |
| `/dev/logs` | My Logs | Developer, Intern |
| `/dev/add` | Add Log | Developer, Intern |
| `/dev/upload` | Upload Excel | Developer, Intern |
| `/dev/reports` | My Reports | Developer, Intern |

---

## Design System

- **Primary:** Deep forest green `#0D4F3C`
- **Accent:** Gold `#C9A84C`
- **Background:** Off-white `#F8F9FA`
- **Cards:** White with soft shadow
- **Font:** Plus Jakarta Sans (headings) + Inter (body)

---

## Tech Stack

- React 18 + Vite
- React Router v6
- Tailwind CSS v3
- Axios (API calls)
- Recharts (charts)
- Lucide React (icons)
