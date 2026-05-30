const { pool } = require('../config/db');
const logger = require('../utils/logger');
const {
    sendNewBookingNotifications,
    sendOtpEmail,
    notifyUserServiceCompletedEmail,
} = require('../utils/emailService');
const {
    notifyAgentsAboutNewBooking,
    notifyAdminsAboutNewBooking,
    notifyUserAboutBookingStatus
} = require('./notificationController');

// Helper to format booking object
// Helper: generate a 6-digit numeric OTP
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

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
        otp_code: row.otp_code || null,
        otp_expires_at: row.otp_expires_at || null,
        otp_verified: !!row.otp_verified,
        coupon_code: row.coupon_code || null,
        discount_amount: row.discount_amount || 0,
        created_at: row.created_at,
        location: row.location || null,
        city: row.city || null,
        area: row.area || null,
        service_category: row.service_category || null,
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
            phone: row.agent_phone,
            service_category: row.agent_category || null
        } : null
    };
};

// @desc    Create new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { service_id, date, time, address, notes, location, city, area, coupon_code } = req.body;

        if (!service_id || !date || !time || !address) {
            return res.status(400).json({ message: 'Please provide service_id, date, time, and address' });
        }

        // ── Backend validation: sanitize location inputs ──
        const safeCity = city ? String(city).trim().slice(0, 100) : null;
        const safeArea = area ? String(area).trim().slice(0, 100) : null;

        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ message: 'Service not found' });
        }
        // Derive service_category from the service record (not from frontend)
        const serviceCategory = service[0].category ? service[0].category.toLowerCase().trim() : null;

        const price = Number(service[0].price);
        let subtotal = price;
        let discount_amount = 0;

        // Apply discount if coupon provided
        if (coupon_code) {
            const [coupons] = await pool.query('SELECT * FROM coupons WHERE code = ?', [coupon_code]);
            if (coupons.length > 0) {
                const c = coupons[0];
                let isValid = true;
                if (c.valid_to && new Date() > new Date(c.valid_to)) isValid = false;
                if (c.usage_limit && c.used_count >= c.usage_limit) isValid = false;
                
                if (isValid) {
                    if (c.discount_type === 'percentage') {
                        discount_amount = (subtotal * c.discount_value) / 100;
                        if (c.max_discount && discount_amount > c.max_discount) {
                            discount_amount = c.max_discount;
                        }
                    } else {
                        discount_amount = c.discount_value;
                    }
                    if (discount_amount > subtotal) discount_amount = subtotal;

                    // Update used_count
                    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [c.id]);
                }
            }
        }

        subtotal = subtotal - discount_amount;
        
        const tax = subtotal * 0.18;
        const platform_fee = 49.00;
        const total_price = subtotal + tax + platform_fee;

        const [result] = await pool.query(
            `INSERT INTO bookings
             (user_id, service_id, date, time, address, location, city, area, service_category,
              notes, subtotal, tax, platform_fee, total_price, status, coupon_code, discount_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [
                req.user.id, service_id, date, time, address,
                location || safeCity || null,  // keep legacy location field populated
                safeCity,
                safeArea,
                serviceCategory,
                notes,
                subtotal, tax, platform_fee, total_price,
                coupon_code || null, discount_amount
            ]
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
                bookingData.time,
                serviceCategory,
                safeCity
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
                a.name as agent_name, a.email as agent_email, a.phone as agent_phone, a.service_category as agent_category,
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

// @desc    Get available bookings (Agent) — filtered by service_category AND city with fallback
// @route   GET /api/bookings/available
const getAvailableBookings = async (req, res) => {
    try {
        // Fetch the agent's service_category, city, and area
        const [agentRows] = await pool.query(
            'SELECT service_category, location, city, area FROM users WHERE id = ?',
            [req.user.id]
        );
        const agentData = agentRows[0] || {};
        const agentCategory = (agentData.service_category || '').toLowerCase().trim();
        // Use city if populated, fall back to legacy location field
        const agentCity = (agentData.city || agentData.location || '').toLowerCase().trim();
        const agentArea = (agentData.area || '').toLowerCase().trim();

        // Base: bookings already assigned to this agent (regardless of status)
        let query = `
            SELECT b.*, 
            s.name as service_name, s.description as service_desc, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
            u.name as user_name, u.phone as user_phone
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            WHERE (b.status = 'assigned' AND b.agent_id = ?)
        `;
        const params = [req.user.id];

        if (agentCategory) {
            if (agentCity) {
                // Primary: match category + city (and optionally area)
                query += `
                    OR (
                        b.status = 'pending' AND b.agent_id IS NULL
                        AND LOWER(TRIM(b.service_category)) = ?
                        AND (
                            LOWER(TRIM(COALESCE(b.city, b.location, ''))) = ?
                            OR b.city IS NULL AND b.location IS NULL
                        )
                    )
                `;
                params.push(agentCategory, agentCity);
            } else {
                // No city on agent profile — match by category only
                query += ` OR (b.status = 'pending' AND b.agent_id IS NULL AND LOWER(TRIM(b.service_category)) = ?)`;
                params.push(agentCategory);
            }
        }

        query += ` ORDER BY b.date ASC`;

        const [bookings] = await pool.query(query, params);

        console.log(`[LOCATION FILTER] Agent [${req.user.id}] Category: '${agentCategory}' | City: '${agentCity}' | Area: '${agentArea}'`);
        console.log(`[LOCATION FILTER] Found ${bookings.length} available/assigned bookings.`);

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
        if (booking[0].status !== 'pending' && booking[0].status !== 'assigned') {
            return res.status(400).json({ message: 'Booking already processed' });
        }

        // Security: if booking is already assigned, only the assigned agent can accept it
        if (booking[0].status === 'assigned' && booking[0].agent_id !== req.user.id) {
            return res.status(403).json({ message: 'This booking is assigned to another agent' });
        }

        // Strict validation: Agent's service category must match the booking's service_category (from bookings table directly)
        const [[agentData]] = await pool.query('SELECT service_category FROM users WHERE id = ?', [req.user.id]);

        const agentCat = agentData?.service_category ? agentData.service_category.toLowerCase().trim() : '';
        const bookingCat = booking[0].service_category ? booking[0].service_category.toLowerCase().trim() : '';

        console.log(`[DEBUG - ACCEPT] Agent Category: '${agentCat}' | Booking Category: '${bookingCat}'`);

        if (!agentCat || agentCat !== bookingCat) {
            return res.status(403).json({ message: `Forbidden: You can only accept bookings matching your service category (${agentCat || 'None'})` });
        }

        await pool.query('UPDATE bookings SET status = "accepted", agent_id = ? WHERE id = ?', [req.user.id, req.params.id]);

        const query = `
            SELECT b.*, 
            s.name as service_name, COALESCE(s.image_url, s.image) as service_image, s.price as service_price,
            u.name as user_name, u.email as user_email, u.phone as user_phone, u.id as user_id,
            (SELECT service_category FROM users WHERE id = b.agent_id) as agent_category
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

// @desc    Reject assigned booking (Agent)
// @route   PATCH /api/bookings/:id/reject
const rejectBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only assigned agents can reject a booking
        if (booking[0].status !== 'assigned' || booking[0].agent_id !== req.user.id) {
            return res.status(400).json({ message: 'You can only reject bookings assigned to you' });
        }

        // Reset to pending so other agents can see it
        await pool.query('UPDATE bookings SET status = "pending", agent_id = NULL WHERE id = ?', [req.params.id]);

        return res.json({ message: 'Booking rejected and made available to other agents.' });
    } catch (error) {
        console.error('Reject booking error:', error);
        return res.status(500).json({ message: 'Server error rejecting booking' });
    }
};

// @desc    Start booking (Agent) — also generates OTP for completion verification
// @route   PATCH /api/bookings/:id/start
const startBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].agent_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: you are not the assigned agent for this booking' });
        }
        if (booking[0].status !== 'accepted') {
            return res.status(400).json({ message: 'Booking must be accepted first' });
        }

        // Generate OTP for completion verification
        const otpCode = generateOtpCode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await pool.query(
            'UPDATE bookings SET status = "in_progress", otp_code = ?, otp_expires_at = ?, otp_verified = FALSE WHERE id = ?',
            [otpCode, otpExpiresAt, req.params.id]
        );

        logger.info(`[OTP] Generated for Booking #${req.params.id}: ${otpCode} (expires ${otpExpiresAt.toISOString()})`);

        // Send OTP email to user
        try {
            const [userRows] = await pool.query(
                'SELECT u.name, u.email FROM users u JOIN bookings b ON b.user_id = u.id WHERE b.id = ?',
                [req.params.id]
            );
            if (userRows.length) {
                await sendOtpEmail(userRows[0].email, userRows[0].name, req.params.id, otpCode, otpExpiresAt);
            }
        } catch (emailErr) {
            logger.error('[OTP] Failed to send OTP email (non-fatal):', emailErr.message);
        }

        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        return res.json({ ...updated[0], _id: updated[0].id });
    } catch (error) {
        console.error('Start booking error:', error);
        return res.status(500).json({ message: 'Server error starting booking' });
    }
};

// @desc    Complete booking (Agent) — now REQUIRES OTP verification first
// @route   PATCH /api/bookings/:id/complete
const completeBooking = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].agent_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: you are not the assigned agent for this booking' });
        }
        if (booking[0].status !== 'in_progress') {
            return res.status(400).json({ message: 'Booking must be in progress' });
        }

        // ── OTP gate: agent must verify OTP before completing ──
        if (!booking[0].otp_verified) {
            return res.status(400).json({ message: 'OTP verification required before completing the booking. Please enter the OTP provided by the customer.' });
        }

        const b = booking[0];

        // Update booking: mark completed + release escrow
        await pool.query(
            'UPDATE bookings SET status = "completed", escrow_status = "released" WHERE id = ?',
            [req.params.id]
        );

        // Calculate agent payout
        const grossAmount = Number(b.total_price);
        const platformCommission = Number(b.platform_fee) + Number(b.tax);
        const agentAmount = Number(b.subtotal);

        // Create payout record
        await pool.query(
            `INSERT INTO payouts (booking_id, agent_id, gross_amount, platform_commission, agent_amount, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [req.params.id, req.user.id, grossAmount, platformCommission, agentAmount]
        );

        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        return res.json({ ...updated[0], _id: updated[0].id });
    } catch (error) {
        console.error('Complete booking error:', error);
        return res.status(500).json({ message: 'Server error completing booking' });
    }
};

// @desc    Generate / Resend OTP for booking
// @route   POST /api/bookings/:id/generate-otp
const generateOtp = async (req, res) => {
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking[0].status !== 'in_progress') {
            return res.status(400).json({ message: 'OTP can only be generated for in-progress bookings' });
        }

        const otpCode = generateOtpCode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await pool.query(
            'UPDATE bookings SET otp_code = ?, otp_expires_at = ?, otp_verified = FALSE WHERE id = ?',
            [otpCode, otpExpiresAt, req.params.id]
        );

        logger.info(`[OTP] Resent for Booking #${req.params.id}: ${otpCode}`);

        // Send OTP email to user
        try {
            const [userRows] = await pool.query(
                'SELECT u.name, u.email FROM users u JOIN bookings b ON b.user_id = u.id WHERE b.id = ?',
                [req.params.id]
            );
            if (userRows.length) {
                await sendOtpEmail(userRows[0].email, userRows[0].name, req.params.id, otpCode, otpExpiresAt);
            }
        } catch (emailErr) {
            logger.error('[OTP] Failed to send OTP email (non-fatal):', emailErr.message);
        }

        return res.json({ message: 'OTP sent successfully', otp_expires_at: otpExpiresAt });
    } catch (error) {
        console.error('Generate OTP error:', error);
        return res.status(500).json({ message: 'Server error generating OTP' });
    }
};

// @desc    Verify OTP and mark booking as completed
// @route   POST /api/bookings/:id/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: 'OTP is required' });
        }

        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const b = booking[0];

        // Security: only the assigned agent can verify OTP
        if (b.agent_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: you are not the assigned agent for this booking' });
        }

        if (b.status !== 'in_progress') {
            return res.status(400).json({ message: 'Booking must be in progress to verify OTP' });
        }
        if (b.otp_verified) {
            return res.status(400).json({ message: 'OTP already verified for this booking' });
        }

        // Check OTP match
        if (b.otp_code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
        }

        // Check expiry
        if (new Date() > new Date(b.otp_expires_at)) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        // OTP is valid — mark as verified AND complete the booking
        await pool.query(
            'UPDATE bookings SET otp_verified = TRUE, status = "completed", escrow_status = "released" WHERE id = ?',
            [req.params.id]
        );

        // Create payout record
        const grossAmount = Number(b.total_price);
        const platformCommission = Number(b.platform_fee) + Number(b.tax);
        const agentAmount = Number(b.subtotal);

        await pool.query(
            `INSERT INTO payouts (booking_id, agent_id, gross_amount, platform_commission, agent_amount, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [req.params.id, b.agent_id, grossAmount, platformCommission, agentAmount]
        );

        // Fetch user and service data for email
        const [userData] = await pool.query('SELECT name, email FROM users WHERE id = ?', [b.user_id]);
        const [serviceData] = await pool.query('SELECT name FROM services WHERE id = ?', [b.service_id]);

        if (userData.length && serviceData.length) {
            await notifyUserServiceCompletedEmail(userData[0], b, serviceData[0]);
        }

        console.log(`✅ OTP verified for Booking #${req.params.id} — marked as COMPLETED`);

        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        return res.json({ message: 'OTP verified. Booking completed successfully.', booking: { ...updated[0], _id: updated[0].id } });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ message: 'Server error verifying OTP' });
    }
};

// @desc    Cancel booking (User) — refunds escrow if paid
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

        // If the booking was paid, mark escrow as refunded
        const escrowUpdate = booking[0].payment_status === 'paid' ? ', escrow_status = "refunded"' : '';
        await pool.query(`UPDATE bookings SET status = "cancelled"${escrowUpdate} WHERE id = ?`, [req.params.id]);

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
            a.name as agent_name, a.email as agent_email, a.service_category as agent_category
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
            a.name as agent_name, a.email as agent_email, a.phone as agent_phone, a.service_category as agent_category 
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
    getBookingById,
    generateOtp,
    verifyOtp,
    rejectBooking
};
