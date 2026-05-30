const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');
const initSocket = require('./socket/index');
const logger = require('./utils/logger');
const { verifySmtp } = require('./utils/emailService');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────────────────────────
// CORS — restrict to FRONTEND_URL in production
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        logger.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io CORS — same origin policy
// ─────────────────────────────────────────────────────────────────────────────
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting on auth routes — prevents brute-force attacks
// ─────────────────────────────────────────────────────────────────────────────
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch {
    logger.warn('[Server] express-rate-limit not installed — skipping rate limiting. Run: npm install express-rate-limit');
}

if (rateLimit) {
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20,
        message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);
    logger.info('[Server] Rate limiting active on auth routes.');
}

app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Request logger middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    logger.debug(`[${req.method}] ${req.originalUrl} — ip: ${req.ip}`);
    next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Database init
// ─────────────────────────────────────────────────────────────────────────────
initializeDatabase();

// ─────────────────────────────────────────────────────────────────────────────
// Health Checks
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'ServeX API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health/email', async (_req, res) => {
    const result = await verifySmtp();
    const status = result.ok ? 200 : 503;
    res.status(status).json({
        status: result.ok ? 'ok' : 'error',
        smtp: result.ok ? 'connected' : 'disconnected',
        reason: result.reason || null,
        user: (process.env.SMTP_USER || '').trim() || 'not configured',
        host: (process.env.SMTP_HOST || '').trim() || 'not configured',
        timestamp: new Date().toISOString(),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.js'));
app.use('/api/services',      require('./routes/services.js'));
app.use('/api/bookings',      require('./routes/bookings.js'));
app.use('/api/users',         require('./routes/users.js'));
app.use('/api/notifications', require('./routes/notifications.js'));
app.use('/api/payment',       require('./routes/payment.js'));
app.use('/api/reviews',       require('./routes/reviews.js'));
app.use('/api/coupons',       require('./routes/coupons.js'));
app.use('/api/admin',         require('./routes/admin.js'));
app.use('/api/chat',          require('./routes/chat.js'));
app.use('/api/upload',        require('./routes/upload.js'));

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Socket + Server start
// ─────────────────────────────────────────────────────────────────────────────
initSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`💚 Health: http://localhost:${PORT}/api/health`);
    logger.info(`📧 Email health: http://localhost:${PORT}/api/health/email`);
    logger.info(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
});
