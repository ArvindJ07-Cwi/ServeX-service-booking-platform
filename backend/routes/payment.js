const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payment/create-order — Create Razorpay order
router.post('/create-order', protect, createOrder);

// POST /api/payment/verify — Verify payment signature and create booking
router.post('/verify', protect, verifyPayment);

module.exports = router;
