const { pool } = require('../config/db');

// @desc    Submit a review for a completed booking
// @route   POST /api/reviews
const createReview = async (req, res) => {
    try {
        const { booking_id, rating, comment } = req.body;

        if (!booking_id || !rating) {
            return res.status(400).json({ message: 'booking_id and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify the booking exists, is completed, and belongs to this user
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only review your own bookings' });
        }

        if (booking[0].status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed bookings' });
        }

        if (!booking[0].agent_id) {
            return res.status(400).json({ message: 'No agent was assigned to this booking' });
        }

        // Check if review already exists
        const [existing] = await pool.query('SELECT * FROM reviews WHERE booking_id = ?', [booking_id]);
        if (existing.length) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }

        // Create the review
        const [result] = await pool.query(
            'INSERT INTO reviews (booking_id, user_id, service_id, agent_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [booking_id, req.user.id, booking[0].service_id, booking[0].agent_id, rating, comment || null]
        );

        const [review] = await pool.query(`
            SELECT r.*, u.name as user_name, s.name as service_name, a.name as agent_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            JOIN users a ON r.agent_id = a.id
            WHERE r.id = ?
        `, [result.insertId]);

        return res.status(201).json(review[0]);
    } catch (error) {
        console.error('Create review error:', error);
        return res.status(500).json({ message: 'Server error creating review' });
    }
};

// @desc    Get review for a specific booking
// @route   GET /api/reviews/booking/:bookingId
const getReviewByBooking = async (req, res) => {
    try {
        const [review] = await pool.query(`
            SELECT r.*, u.name as user_name, s.name as service_name, a.name as agent_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            JOIN users a ON r.agent_id = a.id
            WHERE r.booking_id = ?
        `, [req.params.bookingId]);

        if (!review.length) {
            return res.status(404).json({ message: 'No review found for this booking' });
        }

        return res.json(review[0]);
    } catch (error) {
        console.error('Get review error:', error);
        return res.status(500).json({ message: 'Server error fetching review' });
    }
};

// @desc    Get all reviews for a service
// @route   GET /api/reviews/service/:serviceId
const getReviewsByService = async (req, res) => {
    try {
        const [reviews] = await pool.query(`
            SELECT r.*, u.name as user_name, a.name as agent_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN users a ON r.agent_id = a.id
            WHERE r.service_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.serviceId]);

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        return res.json({ reviews, avgRating: Number(avgRating), totalReviews: reviews.length });
    } catch (error) {
        console.error('Get service reviews error:', error);
        return res.status(500).json({ message: 'Server error fetching reviews' });
    }
};

// @desc    Get all reviews for an agent
// @route   GET /api/reviews/agent/:agentId
const getReviewsByAgent = async (req, res) => {
    try {
        const [reviews] = await pool.query(`
            SELECT r.*, u.name as user_name, s.name as service_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            WHERE r.agent_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.agentId]);

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        return res.json({ reviews, avgRating: Number(avgRating), totalReviews: reviews.length });
    } catch (error) {
        console.error('Get agent reviews error:', error);
        return res.status(500).json({ message: 'Server error fetching agent reviews' });
    }
};

module.exports = {
    createReview,
    getReviewByBooking,
    getReviewsByService,
    getReviewsByAgent
};
