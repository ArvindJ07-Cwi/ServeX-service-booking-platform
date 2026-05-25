const express = require('express');
const { pool } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Get messages for a booking
router.get('/:bookingId', protect, async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Ensure user is authorized for this booking
        const [bookings] = await pool.query(
            'SELECT user_id, agent_id FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        const booking = bookings[0];
        if (req.user.id !== booking.user_id && req.user.id !== booking.agent_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }
        
        const [messages] = await pool.query(
            'SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.booking_id = ? ORDER BY m.created_at ASC',
            [bookingId]
        );
        
        res.json(messages);
    } catch (error) {
        console.error('Chat fetch error:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

module.exports = router;
