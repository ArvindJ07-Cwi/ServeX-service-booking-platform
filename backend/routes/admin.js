const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getAllUsers,
    getAllAgents,
    updateUserStatus,
    getAllPayments,
    updateBookingStatus
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/agents', getAllAgents);
router.patch('/users/:id/status', updateUserStatus);
router.get('/payments', getAllPayments);
router.patch('/bookings/:id/status', updateBookingStatus);

module.exports = router;
