# ServeX — Project Workflow

## Quick Start

> **IMPORTANT:** You need TWO terminals running simultaneously.

### Terminal 1 — Backend (port 5000)
```bash
cd server
node seed.js      # Only first time or to reset data
node server.js    # Starts API server
```

### Terminal 2 — Frontend (port 5173)
```bash
npm run dev       # Starts Vite dev server
```

### Open in Browser
[http://localhost:5173](http://localhost:5173)

---

## Test Credentials

| Role  | Email               | Password |
|-------|---------------------|----------|
| User  | `user@example.com`  | `123456` |
| Agent | `agent@example.com` | `123456` |
| Admin | `admin@example.com` | `123456` |

---

## Project Structure

```
service-booking-platform--main/
├── src/                    # React frontend (Vite + Tailwind)
│   ├── components/         # Navbar, ServiceCard, BookingCard, etc.
│   ├── context/            # AuthContext, CartContext
│   ├── pages/              # Home, Login, Register, Dashboards, etc.
│   ├── routes/             # ProtectedRoute
│   ├── services/           # API client (axios)
│   └── index.css           # Tailwind theme + custom styles
├── server/                 # Express.js backend
│   ├── config/db.js        # SQLite database setup
│   ├── controllers/        # Auth, Services, Bookings, Notifications
│   ├── middleware/          # JWT auth, error handling
│   ├── routes/             # API routes
│   ├── utils/              # Token generation, email service
│   ├── seed.js             # Database seeder
│   └── server.js           # Express entry point
├── index.html              # HTML entry point
├── vite.config.js          # Vite config with API proxy
└── package.json            # Frontend dependencies
```

---

## Features

- **Authentication**: JWT-based login/register with role-based access (user/agent/admin)
- **Service Catalog**: 25 services with categories, images, pricing
- **Cart & Checkout**: Add services to cart → checkout with address/date/time
- **Booking Flow**: User books → Agent accepts → Starts → Completes
- **Two-Way Live Updates**: Both user and agent dashboards poll every 5 seconds
- **Notifications**: In-app notifications for booking status changes

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Make sure backend is running on port 5000 |
| Blank page after login | Clear browser localStorage (F12 → Application → Local Storage → Clear) |
| No services showing | Run `cd server && node seed.js` to seed data |
| Images not loading | Check internet — images are from Unsplash CDN |
| Port 5000 in use | Kill existing process or change PORT in `server/.env` |
| Port 5173 in use | Vite auto-selects next port (check terminal output) |
