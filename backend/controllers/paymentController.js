const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendNewBookingNotifications, notifyUserPaymentSuccessEmail } = require('../utils/emailService');
const {
    notifyAgentsAboutNewBooking,
    notifyAdminsAboutNewBooking,
    notifyUserPaymentSuccess
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
        const { amount, service_id, date, time, address, notes, location, city, area, coupon_code } = req.body;

        console.log('\n====== CREATE ORDER REQUEST ======');
        console.log('Amount (rupees):', amount);
        console.log('Service ID:', service_id);
        console.log('User ID:', req.user.id);
        console.log('Coupon Code:', coupon_code);

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
        // CRITICAL: payment_capture: 1 enables AUTO-CAPTURE
        // Without this, payment is only "authorized" but NOT "captured" —
        // meaning money is NEVER received and dashboard shows failed/authorized
        // Calculate exact amount with discount in backend to be safe
        let price = Number(service[0].price);
        let subtotal = price;
        let discount_amount = 0;

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
                        if (c.max_discount && discount_amount > c.max_discount) discount_amount = c.max_discount;
                    } else {
                        discount_amount = c.discount_value;
                    }
                    if (discount_amount > subtotal) discount_amount = subtotal;
                }
            }
        }

        subtotal -= discount_amount;
        const tax = subtotal * 0.18;
        const platform_fee = 49.00;
        const total_price = subtotal + tax + platform_fee;

        // Use the calculated total_price instead of frontend amount to prevent tampering
        const amountInPaise = Math.round(total_price * 100);
        // Sanitize location inputs server-side
        const safeCity = city ? String(city).trim().slice(0, 100) : null;
        const safeArea = area ? String(area).trim().slice(0, 100) : null;
        const resolvedLocation = location || safeCity || '';

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${req.user.id}`,
            payment_capture: 1,
            notes: {
                user_id: String(req.user.id),
                service_id: String(service_id),
                date,
                time,
                address,
                location: resolvedLocation,
                city: safeCity || '',
                area: safeArea || '',
                booking_notes: notes || '',
                coupon_code: coupon_code || ''
            }
        };

        console.log('Amount in paise:', amountInPaise);
        console.log('Creating Razorpay order with options:', JSON.stringify(options, null, 2));

        const order = await razorpay.orders.create(options);

        console.log('✅ Order created successfully:', order.id);
        console.log('Order amount (paise):', order.amount);
        console.log('Order status:', order.status);
        console.log('================================\n');

        return res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('❌ Create Razorpay order error:', error);
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
            notes,
            location,
            city,
            area,
            coupon_code
        } = req.body;

        console.log('\n====== VERIFY PAYMENT REQUEST ======');
        console.log('Order ID:', razorpay_order_id);
        console.log('Payment ID:', razorpay_payment_id);
        console.log('Signature:', razorpay_signature ? '(received)' : '(MISSING!)');
        console.log('Service ID:', service_id);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('❌ Missing payment verification data');
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification data'
            });
        }

        if (!service_id || !date || !time || !address) {
            console.error('❌ Missing booking details');
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

        console.log('Expected signature:', expectedSignature);
        console.log('Received signature:', razorpay_signature);
        console.log('Signatures match:', expectedSignature === razorpay_signature);

        if (expectedSignature !== razorpay_signature) {
            console.error('❌ Signature mismatch! Payment verification failed.');
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed — invalid signature'
            });
        }

        console.log('✅ Signature verified successfully');

        // Step 1.5: Fetch payment details from Razorpay to confirm capture
        let paymentDetails;
        try {
            paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
            console.log('Payment status on Razorpay:', paymentDetails.status);
            console.log('Payment method:', paymentDetails.method);
            console.log('Payment amount (paise):', paymentDetails.amount);
            console.log('Captured:', paymentDetails.captured ? 'YES ✅' : 'NO ❌');

            if (paymentDetails.status !== 'captured') {
                console.warn('⚠️  Payment not captured yet, status:', paymentDetails.status);
                // Attempt manual capture if not auto-captured
                if (paymentDetails.status === 'authorized') {
                    console.log('Attempting manual capture...');
                    await razorpay.payments.capture(razorpay_payment_id, paymentDetails.amount, 'INR');
                    console.log('✅ Manual capture successful');
                }
            }
        } catch (fetchErr) {
            console.error('⚠️  Could not fetch/capture payment details (non-fatal):', fetchErr.message);
        }

        // Step 2: Payment verified — now create the booking
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const price = Number(service[0].price);
        let subtotal = price;
        let discount_amount = 0;

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
                        if (c.max_discount && discount_amount > c.max_discount) discount_amount = c.max_discount;
                    } else {
                        discount_amount = c.discount_value;
                    }
                    if (discount_amount > subtotal) discount_amount = subtotal;

                    // Update used_count
                    if (paymentDetails && paymentDetails.status === 'captured') {
                        await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [c.id]);
                    }
                }
            }
        }

        subtotal -= discount_amount;
        const tax = subtotal * 0.18;
        const platform_fee = 49.00;
        const total_price = subtotal + tax + platform_fee;

        const serviceCategory = service[0].category ? service[0].category.toLowerCase().trim() : '';

        // Sanitize location inputs (never trust frontend)
        const safeCity = city ? String(city).trim().slice(0, 100) : null;
        const safeArea = area ? String(area).trim().slice(0, 100) : null;
        const resolvedLocation = location || safeCity || null;

        const [result] = await pool.query(
            `INSERT INTO bookings (user_id, service_id, date, time, address, location, city, area, service_category, notes, subtotal, tax, platform_fee, total_price, status, payment_status, escrow_status, payment_id, order_id, coupon_code, discount_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'paid', 'held', ?, ?, ?, ?)`,
            [
                req.user.id,
                service_id,
                date,
                time,
                address,
                resolvedLocation,
                safeCity,
                safeArea,
                serviceCategory,
                notes || null,
                subtotal,
                tax,
                platform_fee,
                total_price,
                razorpay_payment_id,
                razorpay_order_id,
                coupon_code || null,
                discount_amount
            ]
        );

        // ── SMART AGENT ASSIGNMENT ──
        // Find best matching agent based on service category + location
        let assignedAgentId = null;

        try {
            let agentQuery = `
                SELECT u.id, u.name,
                    (SELECT COUNT(*) FROM bookings b2 WHERE b2.agent_id = u.id AND b2.status IN ('accepted','assigned','in_progress')) as active_bookings
                FROM users u
                WHERE u.role = 'agent' AND u.availability_status = TRUE
            `;
            const agentParams = [];

            // Match by service category (always required)
            if (serviceCategory) {
                agentQuery += ` AND LOWER(u.service_category) = LOWER(?)`;
                agentParams.push(serviceCategory);
            }

            // Primary match: same city
            if (safeCity) {
                agentQuery += ` AND (LOWER(COALESCE(u.city, u.location, '')) = LOWER(?)`;
                agentParams.push(safeCity);
                // Optional: narrow further to area
                if (safeArea) {
                    agentQuery += ` AND (LOWER(COALESCE(u.area, '')) = LOWER(?) OR u.area IS NULL)`;
                    agentParams.push(safeArea);
                }
                agentQuery += `)`;
            }

            agentQuery += ` ORDER BY active_bookings ASC LIMIT 1`;

            const [matchingAgents] = await pool.query(agentQuery, agentParams);

            if (matchingAgents.length > 0) {
                assignedAgentId = matchingAgents[0].id;
                await pool.query(
                    'UPDATE bookings SET agent_id = ?, status = "assigned" WHERE id = ?',
                    [assignedAgentId, result.insertId]
                );
                console.log(`✅ Auto-assigned agent #${assignedAgentId} (${matchingAgents[0].name}) to booking #${result.insertId}`);
            } else if (safeCity && serviceCategory) {
                // Fallback 1: same city, ignore area
                const [cityFallback] = await pool.query(
                    `SELECT u.id, u.name,
                        (SELECT COUNT(*) FROM bookings b2 WHERE b2.agent_id = u.id AND b2.status IN ('accepted','assigned','in_progress')) as active_bookings
                    FROM users u
                    WHERE u.role = 'agent' AND u.availability_status = TRUE
                      AND LOWER(u.service_category) = LOWER(?)
                      AND LOWER(COALESCE(u.city, u.location, '')) = LOWER(?)
                    ORDER BY active_bookings ASC LIMIT 1`,
                    [serviceCategory, safeCity]
                );
                if (cityFallback.length > 0) {
                    assignedAgentId = cityFallback[0].id;
                    await pool.query(
                        'UPDATE bookings SET agent_id = ?, status = "assigned" WHERE id = ?',
                        [assignedAgentId, result.insertId]
                    );
                    console.log(`✅ City-fallback agent #${assignedAgentId} (${cityFallback[0].name}) assigned to booking #${result.insertId}`);
                } else {
                    // Fallback 2: category only (any city)
                    const [catFallback] = await pool.query(
                        `SELECT u.id, u.name,
                            (SELECT COUNT(*) FROM bookings b2 WHERE b2.agent_id = u.id AND b2.status IN ('accepted','assigned','in_progress')) as active_bookings
                        FROM users u
                        WHERE u.role = 'agent' AND u.availability_status = TRUE AND LOWER(u.service_category) = LOWER(?)
                        ORDER BY active_bookings ASC LIMIT 1`,
                        [serviceCategory]
                    );
                    if (catFallback.length > 0) {
                        assignedAgentId = catFallback[0].id;
                        await pool.query(
                            'UPDATE bookings SET agent_id = ?, status = "assigned" WHERE id = ?',
                            [assignedAgentId, result.insertId]
                        );
                        console.log(`✅ Category-fallback agent #${assignedAgentId} (${catFallback[0].name}) assigned to booking #${result.insertId} (no city match)`);
                    } else {
                        console.log(`⚠️ No matching agent found for booking #${result.insertId} — stays pending`);
                    }
                }
            } else {
                console.log(`⚠️ No matching agent found for booking #${result.insertId} — stays pending`);
            }
        } catch (assignErr) {
            console.error('Agent assignment error (non-fatal):', assignErr);
        }

        // Step 3: Fetch complete booking details
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
        const [booking] = await pool.query(query, [result.insertId]);
        const bookingData = booking[0];

        // Step 4: Send notifications (non-blocking)
        try {
            await notifyUserPaymentSuccess(
                bookingData.user_id, 
                bookingData.id, 
                bookingData.service_name, 
                bookingData.total_price
            );
            
            await notifyUserPaymentSuccessEmail(
                { name: bookingData.user_name, email: bookingData.user_email },
                { id: bookingData.id, total_price: bookingData.total_price },
                { name: bookingData.service_name }
            );

            await notifyAgentsAboutNewBooking(
                bookingData.id,
                bookingData.service_name,
                bookingData.user_name,
                bookingData.date,
                bookingData.time,
                serviceCategory,
                location
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
        console.log('✅ Booking created successfully! ID:', bookingData.id);
        console.log('Payment ID:', bookingData.payment_id);
        console.log('Order ID:', bookingData.order_id);
        console.log('Total:', bookingData.total_price);
        console.log('====================================\n');

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
                location: bookingData.location,
                notes: bookingData.notes,
                totalAmount: bookingData.total_price,
                subtotal: bookingData.subtotal,
                tax: bookingData.tax,
                platformFee: bookingData.platform_fee,
                coupon_code: bookingData.coupon_code,
                discount_amount: bookingData.discount_amount,
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
                },
                agent: bookingData.agent_id ? {
                    _id: bookingData.agent_id,
                    name: bookingData.agent_name,
                    email: bookingData.agent_email,
                    phone: bookingData.agent_phone
                } : null
            }
        });
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment verification failed'
        });
    }
};

module.exports = { createOrder, verifyPayment };
