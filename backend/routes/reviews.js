const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewByBooking,
    getReviewsByService,
    getReviewsByAgent
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/booking/:bookingId', getReviewByBooking);
router.get('/service/:serviceId', getReviewsByService);
router.get('/agent/:agentId', getReviewsByAgent);

module.exports = router;
