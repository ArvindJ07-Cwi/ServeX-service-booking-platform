const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');
const initSocket = require('./socket/index');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Initialize Database Tables
initializeDatabase();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'ServeX API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
const authRoutes = require('./routes/auth.js');
const serviceRoutes = require('./routes/services.js');
const bookingRoutes = require('./routes/bookings.js');
const userRoutes = require('./routes/users.js');
const notificationRoutes = require('./routes/notifications.js');
const paymentRoutes = require('./routes/payment.js');

const reviewRoutes = require('./routes/reviews.js');
const couponRoutes = require('./routes/coupons.js');
const adminRoutes = require('./routes/admin.js');
const chatRoutes = require('./routes/chat.js');
const uploadRoutes = require('./routes/upload.js');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize socket routes
initSocket(io);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
});
