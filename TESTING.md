# Testing Guide - ServeX

Complete testing guide for the ServeX service booking platform.

## Prerequisites

Make sure you've completed the setup:
```bash
npm install
cd server && npm install && cd ..
cd server && node seed.js && cd ..
```

## Manual Testing Scenarios

### 1. User Registration & Login

**Test Registration:**
1. Go to http://localhost:5173/register
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Role: User
3. Click "Create Account"
4. Should redirect to login page

**Test Login:**
1. Go to http://localhost:5173/login
2. Use credentials: user@example.com / 123456
3. Should redirect to homepage with user menu visible

### 2. Service Browsing

**Browse Services:**
1. On homepage, scroll to "Featured Services"
2. Should see 6 services with images
3. Click "View all" to see all 24 services

**View Service Details:**
1. Click on any service card
2. Should show:
   - Service image as hero
   - Description and details
   - Price breakdown
   - "Add to Cart" button

**Filter by Category:**
1. Click on any category (e.g., "Cleaning")
2. Should filter services by that category

### 3. Shopping Cart

**Add to Cart:**
1. Click on a service
2. Click "Add to Cart"
3. Should redirect to cart page
4. Service should appear in cart

**Add Multiple Services:**
1. Go back to home
2. Add 2-3 more services
3. Cart should show all services
4. Total should calculate correctly (subtotal + 18% tax + ₹49/service)

**Remove from Cart:**
1. Click trash icon on any service
2. Service should be removed
3. Total should recalculate

### 4. Booking Creation

**Checkout Process:**
1. With items in cart, click "Proceed to Checkout"
2. Fill in booking details:
   - Address: "123 Test Street, Mumbai"
   - Date: Tomorrow's date
   - Time: Select any time slot
   - Notes: "Please call before arriving"
3. Click "Confirm Booking"
4. Should redirect to booking details page

**Verify Booking:**
1. Should see booking status as "Pending"
2. Should see service details
3. Should see payment summary
4. Should see scheduled date/time

### 5. User Dashboard

**View My Bookings:**
1. Click on user menu → "Dashboard"
2. Should see all your bookings
3. Each booking should show:
   - Service name and image
   - Status badge
   - Date and time
   - Total amount

**Cancel Booking:**
1. Click on a pending booking
2. Click "Cancel Booking"
3. Confirm cancellation
4. Status should change to "Cancelled"

### 6. Agent Workflow

**Login as Agent:**
1. Logout current user
2. Login with: agent@example.com / 123456
3. Should see "Agent Dashboard" in menu

**View Available Bookings:**
1. Go to Agent Dashboard
2. Should see "Available Bookings" section
3. Shows all pending bookings without agents

**Accept Booking:**
1. Click "Accept" on any booking
2. Booking moves to "My Jobs" section
3. Status changes to "Accepted"

**Start Service:**
1. In "My Jobs", click "Start" on accepted booking
2. Status changes to "In Progress"

**Complete Service:**
1. Click "Complete" on in-progress booking
2. Status changes to "Completed"
3. Booking moves to completed section

### 7. Admin Dashboard

**Login as Admin:**
1. Logout and login with: admin@example.com / 123456
2. Should see "Admin Dashboard" in menu

**View All Bookings:**
1. Go to Admin Dashboard
2. Should see all bookings from all users
3. Can filter by status
4. Shows user and agent information

**View Statistics:**
1. Dashboard shows:
   - Total bookings
   - Revenue
   - Active agents
   - Pending bookings

## API Testing with cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123456"
  }'
```

### Get Services
```bash
curl http://localhost:5000/api/services
```

### Get Services by Category
```bash
curl "http://localhost:5000/api/services?category=Cleaning"
```

### Create Booking (requires token)
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "service_id": 1,
    "date": "2026-02-20",
    "time": "10:00 AM",
    "address": "123 Test Street, Mumbai",
    "notes": "Test booking"
  }'
```

## Expected Results

### Service Images
All 24 services should have high-quality images from Unsplash:
- Cleaning services: Home, kitchen, bathroom cleaning
- Appliance: AC, washing machine, refrigerator
- Electrical: Wiring, lights, MCB
- Painting: Full home, single room, exterior
- Plumbing: General, tap installation, drain cleaning
- Salon: Women's, men's, bridal makeup
- Carpentry: Furniture assembly, door repair, custom
- Pest Control: General, termite, bed bugs

### Price Calculations
For a ₹999 service:
- Subtotal: ₹999.00
- Tax (18%): ₹179.82
- Platform Fee: ₹49.00
- Total: ₹1,227.82

### Status Flow
Booking should follow this flow:
1. pending → (agent accepts) → accepted
2. accepted → (agent starts) → in_progress
3. in_progress → (agent completes) → completed

OR

1. pending → (user cancels) → cancelled

## Common Issues

### Images Not Loading
- Check internet connection (images from Unsplash CDN)
- Check browser console for CORS errors
- Verify image URLs in database

### API Errors
- Ensure backend is running on port 5000
- Check `server/.env` configuration
- Verify database exists: `server/database.sqlite`

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET in `.env`
- Verify token in browser DevTools → Application → Local Storage

### Booking Creation Fails
- Ensure user is logged in
- Check service_id exists
- Verify date is in future
- Check backend logs for errors

## Database Verification

Check database contents:
```bash
cd server
sqlite3 database.sqlite

# View users
SELECT * FROM users;

# View services
SELECT * FROM services;

# View bookings
SELECT * FROM bookings;

# Exit
.quit
```

## Performance Testing

### Load Testing
Test with multiple concurrent users:
1. Create 10+ bookings rapidly
2. Switch between user/agent/admin roles
3. Add/remove multiple cart items
4. Check for race conditions

### Image Loading
1. Open Network tab in DevTools
2. Reload homepage
3. All service images should load within 2-3 seconds
4. Check for 404 errors

## Success Criteria

✅ All 24 services display with images
✅ User can register, login, and logout
✅ Services can be added to cart
✅ Bookings can be created with correct pricing
✅ Agent can accept and complete bookings
✅ Admin can view all bookings
✅ Status updates work correctly
✅ Cart persists across page reloads
✅ Responsive design works on mobile

## Automated Testing (Future)

Consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests
- Supertest for API tests
