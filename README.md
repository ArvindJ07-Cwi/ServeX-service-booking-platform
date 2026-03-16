<<<<<<< HEAD
# ServeX - Service Booking Platform

A full-stack service booking platform built with React, Node.js, Express, and SQLite. Book home services like cleaning, plumbing, electrical work, salon services, and more.

## Features

- **User Authentication** - JWT-based authentication with role-based access (User, Agent, Admin)
- **Service Browsing** - Browse 24+ services across 8 categories with high-quality images
- **Shopping Cart** - Add multiple services to cart with persistent storage
- **Booking Management** - Complete booking workflow from creation to completion
- **Real-time Status** - Track booking status with visual timeline
- **Agent Dashboard** - Agents can accept and manage service bookings
- **Admin Dashboard** - Comprehensive admin panel for managing all bookings
- **Responsive Design** - Beautiful UI with Tailwind CSS, works on all devices

## Tech Stack

### Frontend
- React 19 with Vite
- React Router v7 for navigation
- Tailwind CSS v4 for styling
- Axios for API calls
- Lucide React for icons
- Context API for state management

### Backend
- Node.js with Express 5
- SQLite database
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── context/           # React Context (Auth, Cart)
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   └── routes/            # Protected route wrapper
├── server/                # Backend Node.js application
│   ├── config/            # Database configuration
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth & error middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── utils/             # Helper functions
└── public/                # Static assets
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd service-booking-platform
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

4. **Set up environment variables**

Create `server/.env` file:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

5. **Initialize database and seed data**
```bash
cd server
node seed.js
cd ..
```

This will create:
- 3 test users (admin, agent, user) - password: `123456`
- 24 services across 8 categories with images

### Running the Application

**Development Mode:**

1. Start the backend server (Terminal 1):
```bash
cd server
npm start
```
Server runs on http://localhost:5000

2. Start the frontend dev server (Terminal 2):
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Test Accounts

After seeding, you can login with:

- **Admin**: admin@example.com / 123456
- **Agent**: agent@example.com / 123456
- **User**: user@example.com / 123456

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Services
- `GET /api/services` - Get all services (supports ?category=X&search=Y)
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service (admin only)
- `PUT /api/services/:id` - Update service (admin only)
- `DELETE /api/services/:id` - Delete service (admin only)

### Bookings
- `POST /api/bookings` - Create booking (user)
- `GET /api/bookings/my` - Get my bookings (user/agent)
- `GET /api/bookings/available` - Get available bookings (agent)
- `GET /api/bookings/all` - Get all bookings (admin)
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/accept` - Accept booking (agent)
- `PATCH /api/bookings/:id/start` - Start service (agent)
- `PATCH /api/bookings/:id/complete` - Complete service (agent)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (user)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Service Categories

The platform includes 24 services across these categories:

1. **Cleaning** - Home cleaning, kitchen, bathroom
2. **Appliance** - AC, washing machine, refrigerator repair
3. **Electrical** - Wiring, light installation, MCB repair
4. **Painting** - Full home, single room, exterior painting
5. **Plumbing** - General plumbing, tap installation, drain cleaning
6. **Salon** - Women's salon, men's grooming, bridal makeup
7. **Carpentry** - Furniture assembly, door repair, custom furniture
8. **Pest Control** - General pest control, termite, bed bugs

All services include high-quality images from Unsplash.

## Booking Flow

1. **User browses services** → Adds to cart
2. **Checkout** → Provides address, date, time
3. **Booking created** → Status: `pending`
4. **Agent accepts** → Status: `accepted`
5. **Agent starts work** → Status: `in_progress`
6. **Agent completes** → Status: `completed`

Users can cancel bookings before they're in progress.

## Pricing Structure

- Service base price
- 18% tax
- ₹49 platform fee per service
- Total calculated automatically

## Development

### Frontend Scripts
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Scripts
```bash
npm start        # Start server
node seed.js     # Seed database
```

## Database Schema

### Users Table
- id, name, email, password_hash, role, phone, created_at

### Services Table
- id, name, description, price, category, duration, image, created_at

### Bookings Table
- id, user_id, service_id, agent_id, status, date, time, address, notes
- subtotal, tax, platform_fee, total_price, created_at

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@servex.com or open an issue in the repository.
=======
# ServX-Service-Booking_site-
ServX is a full-stack service booking platform with Node.js/Express backend and React/Vite frontend. Users can browse, book, and manage services. Features include authentication, payments, dashboards, and notifications. Built for easy deployment and scalability.
>>>>>>> dd594dfc994e5d27e4e2efeed87ce362649ebdc4
