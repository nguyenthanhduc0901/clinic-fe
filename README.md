## Clinic FE (SPA Admin)

Run:
- npm i
- npm run dev
- Open http://localhost:5173

Proxy: `/api` → http://localhost:3000

Dev login:
- Go to `/login` and click Dev Sign in (Admin/Receptionist/Doctor)
- UI and navigation adjust by role/permissions

Tech:
- Vite + React + TS, React Router v6, TanStack Query, Axios, Zustand, RHF + Zod, Tailwind, Headless UI, Heroicons, date-fns

Structure:
- `src/app` providers and root App
- `src/routes` routes and config
- `src/lib` api, auth, utils
- `src/components` layout and ui
- `src/pages` feature pages and placeholders
