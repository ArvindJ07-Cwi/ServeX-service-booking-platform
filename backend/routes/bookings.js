const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    getAvailableBookings,
    acceptBooking,
    startBooking,
    completeBooking,
    cancelBooking,
    getAllBookings, // For admin
    getBookingById,
    generateOtp,
    verifyOtp,
    rejectBooking
} = require('../controllers/bookingController');
const { protect, admin, agent } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/available', protect, agent, getAvailableBookings);
router.get('/all', protect, admin, getAllBookings); // ADMIN: GET /api/bookings/all
router.get('/:id', protect, getBookingById); // Generic detail view

// Actions
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/reject', protect, agent, rejectBooking);
router.patch('/:id/accept', protect, agent, acceptBooking);
router.patch('/:id/start', protect, agent, startBooking);
router.patch('/:id/complete', protect, agent, completeBooking);

// OTP
router.post('/:id/generate-otp', protect, generateOtp);
router.post('/:id/verify-otp', protect, agent, verifyOtp);

module.exports = router;
