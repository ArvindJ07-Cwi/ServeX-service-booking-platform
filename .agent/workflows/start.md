---
description: How to start the ServX application (backend + frontend)
---

# Start ServX Application

Both the backend server and frontend dev server must be running simultaneously.

## Prerequisites
- Node.js installed
- Dependencies installed:
  - Root: `npm install`
  - Frontend: `cd frontend && npm install`
  - Backend: `cd backend && npm install`

## Steps

// turbo-all

1. Install all dependencies (shortcut):
```bash
cd c:\Users\Arvin\Downloads\ServX\service-booking-platform--main
npm run install:all
```

2. Seed the database (only needed first time):
```bash
cd c:\Users\Arvin\Downloads\ServX\service-booking-platform--main
npm run seed
```

3. Start both Frontend and Backend (preferred):
```bash
cd c:\Users\Arvin\Downloads\ServX\service-booking-platform--main
npm run dev
```

4. Alternatively, start them separately:

**Terminal 1 (Backend):**
```bash
cd c:\Users\Arvin\Downloads\ServX\service-booking-platform--main\backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd c:\Users\Arvin\Downloads\ServX\service-booking-platform--main\frontend
npm run dev
```

5. Open in browser: http://localhost:5173

## Test Credentials

| Role  | Email               | Password |
|-------|---------------------|----------|
| User  | user@example.com    | 123456   |
| Agent | agent@example.com   | 123456   |
| Admin | admin@example.com   | 123456   |

## Troubleshooting

If login/signup fails:
1. Make sure BOTH servers are running (backend on 5000, frontend on 5173)
2. Clear browser localStorage: F12 → Application → Local Storage → Clear all for localhost
3. Re-seed the database: `cd server && node seed.js`
4. Restart both servers
