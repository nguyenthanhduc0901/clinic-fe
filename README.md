## Clinic FE (SPA Admin)

Run:
- npm i
- npm run dev
- Open http://localhost:5173

Proxy: `/api` → http://localhost:3000

ENV (development):
- VITE_API_BASE=/api
- VITE_DEV_FAKE_LOGIN=false  # set true to show dev login buttons

Real login:
- Backend on http://localhost:3000 with endpoints:
  - POST /auth/login → { accessToken, user }
  - GET /auth/my-permissions → { permissions: string[] }
- Steps: Open `/login` → enter email/password → submit → app stores token/user, fetches permissions, and redirects by role.

Dev login (fallback):
- Set VITE_DEV_FAKE_LOGIN=true → at `/login`, use Dev Sign in buttons (Admin/Receptionist/Doctor)
- UI & menu change based on role/permissions

Tech:
- Vite + React + TS, React Router v6, TanStack Query, Axios, Zustand, RHF + Zod, Tailwind, Headless UI, Heroicons, date-fns

Structure:
- `src/app` providers and root App
- `src/routes` routes and config
- `src/lib` api, auth, utils
- `src/components` layout and ui
- `src/pages` feature pages and placeholders

Appointments (read-only):
- Route `/appointments` (Receptionist view): filters date (default today), q, status, page, limit
- Calls GET `/appointments` with above query params; renders orderNumber, patient, phone, doctor, status (badge), note, date + pagination

Dashboard summary:
- Calls GET `/appointments/today/summary?date=YYYY-MM-DD` to display today's counts
