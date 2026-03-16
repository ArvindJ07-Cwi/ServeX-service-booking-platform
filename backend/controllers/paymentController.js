const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendNewBookingNotifications } = require('../utils/emailService');
const {
    notifyAgentsAboutNewBooking,
    notifyAdminsAboutNewBooking
} = require('./notificationController');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
const createOrder = async (req, res) => {
    try {
        const { amount, service_id, date, time, address, notes } = req.body;

        if (!amount || !service_id || !date || !time || !address) {
            return res.status(400).json({
                message: 'Please provide amount, service_id, date, time, and address'
            });
        }

        // Verify service exists
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${req.user.id}`,
            notes: {
                user_id: String(req.user.id),
                service_id: String(service_id),
                date,
                time,
                address,
                booking_notes: notes || ''
            }
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        return res.status(500).json({ message: 'Failed to create payment order' });
    }
};

// @desc    Verify Razorpay payment signature and create booking
// @route   POST /api/payment/verify
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            service_id,
            date,
            time,
            address,
            notes
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification data'
            });
        }

        if (!service_id || !date || !time || !address) {
            return res.status(400).json({
                success: false,
                message: 'Missing booking details'
            });
        }

        // Step 1: Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed — invalid signature'
            });
        }

        // Step 2: Payment verified — now create the booking
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const price = Number(service[0].price);
        const subtotal = price;
        const tax = subtotal * 0.18;
        const platform_fee = 49.00;
        const total_price = subtotal + tax + platform_fee;

        const [result] = await pool.query(
            `INSERT INTO bookings (user_id, service_id, date, time, address, notes, subtotal, tax, platform_fee, total_price, status, payment_status, payment_id, order_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'paid', ?, ?)`,
            [
                req.user.id,
                service_id,
                date,
                time,
                address,
                notes || null,
                subtotal,
                tax,
                platform_fee,
                total_price,
                razorpay_payment_id,
                razorpay_order_id
            ]
        );

        // Step 3: Fetch complete booking details
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
        const bookingData = booking[0];

        // Step 4: Send notifications (non-blocking)
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

        // Step 5: Return success with booking data
        return res.status(201).json({
            success: true,
            message: 'Payment verified and booking created successfully',
            booking: {
                _id: bookingData.id,
                status: bookingData.status,
                payment_status: bookingData.payment_status,
                payment_id: bookingData.payment_id,
                order_id: bookingData.order_id,
                date: bookingData.date,
                time: bookingData.time,
                address: bookingData.address,
                notes: bookingData.notes,
                totalAmount: bookingData.total_price,
                subtotal: bookingData.subtotal,
                tax: bookingData.tax,
                platformFee: bookingData.platform_fee,
                service: {
                    _id: bookingData.service_id,
                    name: bookingData.service_name,
                    description: bookingData.service_desc,
                    price: bookingData.service_price || bookingData.subtotal,
                    image: bookingData.service_image,
                    duration: bookingData.service_duration
                },
                user: {
                    _id: bookingData.user_id,
                    name: bookingData.user_name,
                    email: bookingData.user_email,
                    phone: bookingData.user_phone
                }
            }
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment verification failed'
        });
    }
};

module.exports = { createOrder, verifyPayment };
