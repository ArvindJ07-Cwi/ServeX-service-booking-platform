const { pool } = require('../config/db');
const { sendNewBookingNotifications } = require('../utils/emailService');
const {
    notifyAgentsAboutNewBooking,
    notifyAdminsAboutNewBooking,
    notifyUserAboutBookingStatus
} = require('./notificationController');

// Helper to format booking object
const formatBooking = (row) => {
    if (!row) return null;
    return {
        _id: row.id,
        status: row.status,
        date: row.date,
        time: row.time,
        address: row.address,
        notes: row.notes,
        totalAmount: row.total_price,
        subtotal: row.subtotal,
        tax: row.tax,
        platformFee: row.platform_fee,
        payment_status: row.payment_status || 'pending',
        payment_id: row.payment_id || null,
        order_id: row.order_id || null,
        created_at: row.created_at,
        service: {
            _id: row.service_id,
            name: row.service_name,
            description: row.service_desc,
            price: row.service_price || row.subtotal,
            image: row.service_image,
            duration: row.service_duration
        },
        user: {
            _id: row.user_id,
            name: row.user_name,
            email: row.user_email,
            phone: row.user_phone
        },
        agent: row.agent_id ? {
            _id: row.agent_id,
            name: row.agent_name,
            email: row.agent_email,
            phone: row.agent_phone
        } : null
    };
};

// @desc    Create new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { service_id, date, time, address, notes } = req.body;

        if (!service_id || !date || !time || !address) {
            return res.status(400).json({ message: 'Please provide service_id, date, time, and address' });
        }

        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ message: 'Service not found' });
        }
        const price = Number(service[0].price);
        const subtotal = price;
        const tax = subtotal * 0.18;
        const platform_fee = 49.00;
        const total_price = subtotal + tax + platform_fee;

        const [result] = await pool.query(
            'INSERT INTO bookings (user_id, service_id, date, time, address, notes, subtotal, tax, platform_fee, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")',
            [req.user.id, service_id, date, time, address, notes, subtotal, tax, platform_fee, total_price]
        );

        // Fetch complete details
        const query = `
            SELECT b.*, 
            s.name as service_name, s.description as service_desc, COALESCE(s.image_url, s.image) as service_image, s.duration as service_duration, s.price as service_price,
            u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            WHERE b.id = ?
        `;
        const [booking] = await pool.query(query, [result.insertId]);

        // Send notifications to agents and admins
        const bookingData = booking[0];

        try {
            await notifyAgentsAboutNewBooking(
                bookingData.id,
                bookingData.service_name,
                bookingData.user_name,
                bookingData.date,
                bookingData.time
            );

            await notifyAdminsAboutNewBooking(
                bookingData.id,
                bookingData.service_name,
                bookingData.user_name,
                bookingData.date,
                bookingData.time,
                bookingData.total_price
            );
        } catch (notifError) {
            console.error('Notification error (non-fatal):', notifError);
        }

        // Send email notifications (async, don't wait)
        sendNewBookingNotifications(result.insertId, pool).catch(err => {
            console.error('Email notification error:', err);
        });

        return res.status(201).json(formatBooking(booking[0]));
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ message: 'Server error creating booking' });
    }
};

// @desc    Get my bookings (User or Agent)
// @route   GET /api/bookings/my
const getMyBookings = async (req, res) => {
    try {
        let query = '';
        let params = [req.user.id];

        if (req.user.role === 'agent') {
            query = `
                SELECT b.*, 
                s.name as service_name, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
                u.name as user_name, u.email as user_email, u.phone as user_phone
                FROM bookings b 
                JOIN services s ON b.service_id = s.id 
                JOIN users u ON b.user_id = u.id 
                LEFT JOIN users a ON b.agent_id = a.id
                WHERE b.agent_id = ? 
                ORDER BY b.date DESC, b.time ASC
            `;
        } else {
            query = `
                SELECT b.*, 
                s.name as service_name, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
                a.name as agent_name, a.email as agent_email, a.phone as agent_phone,
                u.name as user_name, u.email as user_email
                FROM bookings b 
                JOIN services s ON b.service_id = s.id 
                JOIN users u ON b.user_id = u.id
                LEFT JOIN users a ON b.agent_id = a.id 
                WHERE b.user_id = ? 
                ORDER BY b.date DESC, b.time ASC
            `;
        }

        const [bookings] = await pool.query(query, params);
        return res.json(bookings.map(formatBooking));
    } catch (error) {
        console.error('Get my bookings error:', error);
        return res.status(500).json({ message: 'Server error fetching bookings' });
    }
};

// @desc    Get available bookings (Agent)
// @route   GET /api/bookings/available
const getAvailableBookings = async (req, res) => {
    try {
        const query = `
            SELECT b.*, 
            s.name as service_name, s.description as service_desc, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
            u.name as user_name, u.phone as user_phone
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            WHERE b.status = 'pending' AND b.agent_id IS NULL AND b.payment_status = 'paid'
            ORDER BY b.date ASC
        `;
        const [bookings] = await pool.query(query);
        return res.json(bookings.map(formatBooking));
    } catch (error) {
        console.error('Get available bookings error:', error);
        return res.status(500).json({ message: 'Server error fetching available bookings' });
    }
};

// @desc    Accept booking (Agent)
// @route   PATCH /api/bookings/:id/accept
const acceptBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].status !== 'pending') {
            return res.status(400).json({ message: 'Booking already processed' });
        }
        await pool.query('UPDATE bookings SET status = "accepted", agent_id = ? WHERE id = ?', [req.user.id, req.params.id]);

        const query = `
            SELECT b.*, 
            s.name as service_name, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
            u.name as user_name, u.email as user_email, u.phone as user_phone, u.id as user_id
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            WHERE b.id = ?
        `;
        const [updated] = await pool.query(query, [req.params.id]);

        try {
            await notifyUserAboutBookingStatus(
                updated[0].user_id,
                req.params.id,
                'accepted',
                updated[0].service_name,
                req.user.name
            );
        } catch (notifError) {
            console.error('Notification error (non-fatal):', notifError);
        }

        return res.json(formatBooking(updated[0]));
    } catch (error) {
        console.error('Accept booking error:', error);
        return res.status(500).json({ message: 'Server error accepting booking' });
    }
};

// @desc    Start booking (Agent)
// @route   PATCH /api/bookings/:id/start
const startBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].agent_id !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (booking[0].status !== 'accepted') {
            return res.status(400).json({ message: 'Booking must be accepted first' });
        }
        await pool.query('UPDATE bookings SET status = "in_progress" WHERE id = ?', [req.params.id]);

        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        return res.json({ ...updated[0], _id: updated[0].id });
    } catch (error) {
        console.error('Start booking error:', error);
        return res.status(500).json({ message: 'Server error starting booking' });
    }
};

// @desc    Complete booking (Agent)
// @route   PATCH /api/bookings/:id/complete
const completeBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].agent_id !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (booking[0].status !== 'in_progress') {
            return res.status(400).json({ message: 'Booking must be in progress' });
        }
        await pool.query('UPDATE bookings SET status = "completed" WHERE id = ?', [req.params.id]);

        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        return res.json({ ...updated[0], _id: updated[0].id });
    } catch (error) {
        console.error('Complete booking error:', error);
        return res.status(500).json({ message: 'Server error completing booking' });
    }
};

// @desc    Cancel booking (User)
// @route   PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (['completed', 'cancelled', 'in_progress'].includes(booking[0].status)) {
            return res.status(400).json({ message: 'Cannot cancel this booking' });
        }
        await pool.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Booking cancelled' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ message: 'Server error cancelling booking' });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/all
const getAllBookings = async (req, res) => {
    try {
        const query = `
            SELECT b.*, 
            s.name as service_name, s.price as service_price,
            u.name as user_name, u.email as user_email,
            a.name as agent_name, a.email as agent_email
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            LEFT JOIN users a ON b.agent_id = a.id 
            ORDER BY b.date DESC
        `;
        const [bookings] = await pool.query(query);
        return res.json(bookings.map(formatBooking));
    } catch (error) {
        console.error('Get all bookings error:', error);
        return res.status(500).json({ message: 'Server error fetching all bookings' });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
const getBookingById = async (req, res) => {
    try {
        const query = `
            SELECT b.*, 
            s.name as service_name, s.description as service_desc, COALESCE(s.image_url, s.image) as service_image, s.duration as service_duration, s.price as service_price,
            u.name as user_name, u.email as user_email, u.phone as user_phone,
            a.name as agent_name, a.email as agent_email, a.phone as agent_phone 
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            LEFT JOIN users a ON b.agent_id = a.id 
            WHERE b.id = ?
        `;
        const [booking] = await pool.query(query, [req.params.id]);

        if (booking[0]) {
            return res.json(formatBooking(booking[0]));
        } else {
            return res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Get booking error:', error);
        return res.status(500).json({ message: 'Server error fetching booking' });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getAvailableBookings,
    acceptBooking,
    startBooking,
    completeBooking,
    cancelBooking,
    getAllBookings,
    getBookingById
};
