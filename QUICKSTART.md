# Quick Start Guide - ServeX

Get the ServeX service booking platform running in 5 minutes!

## Prerequisites
- Node.js v18+ installed
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Initialize Database

```bash
cd server
node seed.js
cd ..
```

This creates:
- SQLite database with all tables
- 3 test users (admin, agent, user)
- 24 services with images across 8 categories

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```
✅ Backend running on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
✅ Frontend running on http://localhost:5173

### 4. Login & Test

Open http://localhost:5173 in your browser.

**Test Accounts:**
- **User**: user@example.com / 123456
- **Agent**: agent@example.com / 123456  
- **Admin**: admin@example.com / 123456

## What to Try

### As a User:
1. Browse services on the homepage
2. Click on a service to view details
3. Add services to cart
4. Go to checkout and create a booking
5. View your bookings in the dashboard

### As an Agent:
1. Login as agent@example.com
2. Go to Agent Dashboard
3. View available bookings
4. Accept a booking
5. Start and complete the service

### As an Admin:
1. Login as admin@example.com
2. Go to Admin Dashboard
3. View all bookings and users
4. Monitor platform activity

## Troubleshooting

**Port already in use?**
- Backend: Change PORT in `server/.env`
- Frontend: Vite will prompt you to use a different port

**Database errors?**
- Delete `server/database.sqlite` and run `node seed.js` again

**Can't login?**
- Make sure backend is running on port 5000
- Check browser console for errors

## Next Steps

- Customize services in `server/seed.js`
- Add your own service images
- Modify styling in `src/index.css`
- Add payment gateway integration
- Deploy to production

## Need Help?

Check the full README.md for detailed documentation.
