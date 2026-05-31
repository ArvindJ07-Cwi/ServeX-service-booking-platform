const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE FIX: .env had leading spaces on SMTP keys — always trim env vars
// ─────────────────────────────────────────────────────────────────────────────
const SMTP_HOST = (process.env.SMTP_HOST || '').trim();
const SMTP_PORT = parseInt((process.env.SMTP_PORT || '587').trim(), 10);
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
const FROM_NAME = (process.env.FROM_NAME || 'ServeX').trim();
const FROM_EMAIL = (process.env.FROM_EMAIL || SMTP_USER || 'noreply@servex.app').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

const FROM_HEADER = `"${FROM_NAME}" <${FROM_EMAIL}>`;

// ─────────────────────────────────────────────────────────────────────────────
// Transporter factory — real SMTP if credentials present, console mock otherwise
// ─────────────────────────────────────────────────────────────────────────────
let _transporter = null;

const getTransporter = () => {
    if (_transporter) return _transporter;

    if (SMTP_USER && SMTP_PASS) {
        // Gmail shorthand: use 'gmail' service which auto-configures host/port/TLS
        const isGmail = SMTP_HOST === 'smtp.gmail.com' || SMTP_USER.endsWith('@gmail.com');

        const transportConfig = isGmail
            ? {
                service: 'gmail',
                auth: { user: SMTP_USER, pass: SMTP_PASS },
            }
            : {
                host: SMTP_HOST || 'smtp.gmail.com',
                port: SMTP_PORT,
                secure: SMTP_PORT === 465,
                auth: { user: SMTP_USER, pass: SMTP_PASS },
                tls: { rejectUnauthorized: false },
            };

        // Add timeouts to prevent hanging on blocked ports
        transportConfig.connectionTimeout = 10000; // 10 seconds
        transportConfig.greetingTimeout = 10000;
        transportConfig.socketTimeout = 15000;

        _transporter = nodemailer.createTransport(transportConfig);
        logger.info(`[Email] Transporter configured: ${isGmail ? 'Gmail service' : `${SMTP_HOST}:${SMTP_PORT}`} as ${SMTP_USER}`);
    } else {
        // Dev/fallback: mock transporter that logs to console
        logger.warn('[Email] SMTP credentials missing — emails will be logged to console only.');
        _transporter = {
            sendMail: async (opts) => {
                logger.info(`\n📧 [EMAIL MOCK]\n  To: ${opts.to}\n  Subject: ${opts.subject}\n  Body: ${opts.text || '(html only)'}\n`);
                return { messageId: `mock-${Date.now()}` };
            },
            verify: (cb) => cb(null, false),
        };
    }
    return _transporter;
};

// ─────────────────────────────────────────────────────────────────────────────
// Verify SMTP connection (used by health-check endpoint) — WITH TIMEOUT
// ─────────────────────────────────────────────────────────────────────────────
const verifySmtp = () => {
    return new Promise((resolve) => {
        if (!SMTP_USER || !SMTP_PASS) {
            return resolve({ ok: false, reason: 'SMTP credentials not configured' });
        }
        const t = getTransporter();
        if (!t.verify) return resolve({ ok: false, reason: 'Mock transporter active' });

        // Timeout after 10 seconds to prevent health endpoint from hanging
        const timeout = setTimeout(() => {
            resolve({ ok: false, reason: 'SMTP verify timed out after 10s — port may be blocked' });
        }, 10000);

        t.verify((err) => {
            clearTimeout(timeout);
            if (err) {
                logger.error('[Email] SMTP verify failed:', err.message);
                resolve({ ok: false, reason: err.message });
            } else {
                resolve({ ok: true });
            }
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Send test email — used by /api/health/email/test endpoint
// ─────────────────────────────────────────────────────────────────────────────
const sendTestEmail = async (toEmail) => {
    const target = toEmail || SMTP_USER;
    if (!target) throw new Error('No recipient email provided');

    const info = await sendWithRetry({
        to: target,
        subject: 'ServeX Email Test ✅',
        text: `This is a test email from ServeX. If you can read this, email delivery is working!\n\nTimestamp: ${new Date().toISOString()}`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                <div style="padding:32px">
                    <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Email Test Successful ✅</h2>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">If you can read this, ServeX email delivery is working correctly.</p>
                    <p style="color:#9ca3af;font-size:12px;margin:0">Sent at: ${new Date().toISOString()}</p>
                </div>
            </div>
        `,
    });
    return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core send with retry (3 attempts, exponential backoff)
// ─────────────────────────────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, attempts = 3) => {
    const opts = { from: FROM_HEADER, ...mailOptions };
    const transporter = getTransporter();
    let lastError;

    for (let i = 1; i <= attempts; i++) {
        try {
            const info = await transporter.sendMail(opts);
            logger.info(`[Email] ✅ Sent to ${opts.to} | Subject: "${opts.subject}" | MsgID: ${info.messageId}`);
            return info;
        } catch (err) {
            lastError = err;
            logger.error(`[Email] ❌ Attempt ${i}/${attempts} failed for ${opts.to}: ${err.message}`);

            // If auth fails, don't retry — credentials are wrong
            if (err.code === 'EAUTH' || err.responseCode === 535) {
                logger.error('[Email] 🚨 Authentication failed — check SMTP_USER and SMTP_PASS. For Gmail, use an App Password (not your regular password).');
                break;
            }

            if (i < attempts) {
                const delay = Math.pow(2, i) * 500; // 1s, 2s, 4s
                await new Promise(r => setTimeout(r, delay));

                // Reset transporter on connection errors to force reconnect
                if (err.code === 'ESOCKET' || err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
                    logger.info('[Email] Resetting transporter for retry...');
                    _transporter = null;
                }
            }
        }
    }

    logger.error(`[Email] 🚨 All ${attempts} attempts failed for ${opts.to}. Last error: ${lastError?.message}`);
    throw lastError;
};

// ─────────────────────────────────────────────────────────────────────────────
// OTP EMAIL — Sent to user when service starts
// ─────────────────────────────────────────────────────────────────────────────
const sendOtpEmail = async (userEmail, userName, bookingId, otpCode, expiresAt) => {
    const expiryStr = new Date(expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    await sendWithRetry({
        to: userEmail,
        subject: `Your ServeX Completion OTP — Booking #${bookingId}`,
        text: `Hello ${userName},\n\nYour service is underway. Share this OTP with your technician to confirm completion:\n\nOTP: ${otpCode}\n\nExpires at: ${expiryStr}\n\nDo NOT share this with anyone else.\n\nServeX Team`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#2563eb;padding:24px 32px">
                    <h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1>
                </div>
                <div style="padding:32px">
                    <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Your Completion OTP</h2>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hello ${userName}, your technician has arrived. Share this OTP to confirm service completion.</p>
                    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px">
                        <p style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1d4ed8;margin:0;font-family:monospace">${otpCode}</p>
                        <p style="font-size:12px;color:#6b7280;margin:8px 0 0">Expires at ${expiryStr} · Do NOT share with anyone else</p>
                    </div>
                    <a href="${FRONTEND_URL}/bookings/${bookingId}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Booking</a>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
                    <p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p>
                </div>
            </div>
        `,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────
const sendForgotPasswordEmail = async (user, resetUrl) => {
    await sendWithRetry({
        to: user.email,
        subject: 'Reset Your ServeX Password',
        text: `Hello ${user.name},\n\nYou requested a password reset. Click this link (expires in 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nServeX Team`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                <div style="padding:32px">
                    <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Reset Your Password</h2>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hello ${user.name}, click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
                    <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Reset Password</a>
                    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0">If you did not request this, you can safely ignore this email.</p>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p></div>
            </div>
        `,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING CONFIRMATION (to user)
// ─────────────────────────────────────────────────────────────────────────────
const sendBookingConfirmationEmail = async (userEmail, userName, booking, serviceName) => {
    await sendWithRetry({
        to: userEmail,
        subject: `Booking Confirmed — ${serviceName} (#${booking.id})`,
        text: `Hello ${userName},\n\nYour booking is confirmed!\n\nService: ${serviceName}\nDate: ${booking.date} at ${booking.time}\nAddress: ${booking.address}\nTotal: ₹${booking.total_price}\n\nView details: ${FRONTEND_URL}/bookings/${booking.id}\n\nThank you for choosing ServeX!`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                <div style="padding:32px">
                    <h2 style="font-size:18px;color:#111827;margin:0 0 4px">Booking Confirmed! ✅</h2>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hello ${userName}, your booking has been received and is pending agent assignment.</p>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px">
                        <table style="width:100%;font-size:14px;border-collapse:collapse">
                            <tr><td style="padding:6px 0;color:#6b7280;width:130px">Service</td><td style="color:#111827;font-weight:600">${serviceName}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Date & Time</td><td style="color:#111827;font-weight:600">${booking.date} at ${booking.time}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Address</td><td style="color:#111827;font-weight:600">${booking.address}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Total Paid</td><td style="color:#2563eb;font-weight:700">₹${booking.total_price}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Booking ID</td><td style="color:#111827;font-family:monospace">#${booking.id}</td></tr>
                        </table>
                    </div>
                    <a href="${FRONTEND_URL}/bookings/${booking.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Booking</a>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p></div>
            </div>
        `,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT NOTIFICATION (new booking available)
// ─────────────────────────────────────────────────────────────────────────────
const sendAgentNewBookingEmail = async (agentEmail, booking, serviceName, userName) => {
    await sendWithRetry({
        to: agentEmail,
        subject: `New Booking Available — ${serviceName}`,
        text: `Hello,\n\nA new booking is available:\n\nService: ${serviceName}\nCustomer: ${userName}\nDate: ${booking.date} at ${booking.time}\nAddress: ${booking.address}\nAmount: ₹${booking.total_price}\n\nLogin to accept: ${FRONTEND_URL}/agent-dashboard\n\nServeX Team`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#111827;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                <div style="padding:32px">
                    <h2 style="font-size:18px;color:#111827;margin:0 0 4px">New Booking Available</h2>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">A new booking matching your service category is available. Login to accept it.</p>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px">
                        <table style="width:100%;font-size:14px;border-collapse:collapse">
                            <tr><td style="padding:6px 0;color:#6b7280;width:130px">Service</td><td style="color:#111827;font-weight:600">${serviceName}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Customer</td><td style="color:#111827;font-weight:600">${userName}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Date & Time</td><td style="color:#111827;font-weight:600">${booking.date} at ${booking.time}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280">Amount</td><td style="color:#2563eb;font-weight:700">₹${booking.total_price}</td></tr>
                        </table>
                    </div>
                    <a href="${FRONTEND_URL}/agent-dashboard" style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Accept Booking</a>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p></div>
            </div>
        `,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE COMPLETED (to user)
// ─────────────────────────────────────────────────────────────────────────────
const notifyUserServiceCompletedEmail = async (user, booking, service) => {
    try {
        await sendWithRetry({
            to: user.email,
            subject: `Service Completed — ${service.name}`,
            text: `Hello ${user.name},\n\nYour ${service.name} service has been completed!\n\nBooking ID: #${booking.id}\n\nPlease leave a review: ${FRONTEND_URL}/bookings/${booking.id}\n\nThank you for using ServeX!`,
            html: `
                <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                    <div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                    <div style="padding:32px">
                        <h2 style="font-size:18px;color:#111827;margin:0 0 4px">Service Completed! 🎉</h2>
                        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hello ${user.name}, your <strong>${service.name}</strong> service has been completed. We hope you're happy with the result!</p>
                        <a href="${FRONTEND_URL}/bookings/${booking.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:12px">Leave a Review</a>
                    </div>
                    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p></div>
                </div>
            `,
        });
    } catch (err) {
        logger.error('[Email] Failed to send service completed email:', err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT SUCCESS (to user)
// ─────────────────────────────────────────────────────────────────────────────
const notifyUserPaymentSuccessEmail = async (user, booking, service) => {
    try {
        await sendWithRetry({
            to: user.email,
            subject: `Payment Confirmed — ₹${booking.total_price} for ${service.name}`,
            text: `Hello ${user.name},\n\nPayment of ₹${booking.total_price} for ${service.name} was successful.\n\nBooking ID: #${booking.id}\n\nView: ${FRONTEND_URL}/bookings/${booking.id}\n\nThank you!`,
            html: `
                <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                    <div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;font-size:22px;margin:0">ServeX</h1></div>
                    <div style="padding:32px">
                        <h2 style="font-size:18px;color:#111827;margin:0 0 4px">Payment Successful ✅</h2>
                        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hello ${user.name}, we received your payment of <strong>₹${booking.total_price}</strong> for ${service.name}.</p>
                        <a href="${FRONTEND_URL}/bookings/${booking.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Booking</a>
                    </div>
                    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">ServeX — Professional Home Services</p></div>
                </div>
            `,
        });
    } catch (err) {
        logger.error('[Email] Failed to send payment success email:', err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK SEND: new booking → user confirmation + agents + admins
// ─────────────────────────────────────────────────────────────────────────────
const sendNewBookingNotifications = async (bookingId, pool) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.*, s.name as service_name, s.category as service_category,
             u.name as user_name, u.email as user_email
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ?`,
            [bookingId]
        );

        if (!rows.length) {
            logger.warn(`[Email] sendNewBookingNotifications: Booking #${bookingId} not found`);
            return;
        }

        const booking = rows[0];
        const userName = booking.user_name;
        const userEmail = booking.user_email;
        const serviceName = booking.service_name;

        // 1. Confirm to user
        await sendBookingConfirmationEmail(userEmail, userName, booking, serviceName).catch(err =>
            logger.error('[Email] User confirmation failed:', err.message)
        );

        // 2. Notify matching agents by email
        const [agents] = await pool.query(
            `SELECT email FROM users WHERE role = 'agent' AND LOWER(TRIM(service_category)) = LOWER(TRIM(?)) AND availability_status = 1`,
            [booking.service_category]
        );

        for (const agent of agents) {
            await sendAgentNewBookingEmail(agent.email, booking, serviceName, userName).catch(err =>
                logger.error(`[Email] Agent notify failed (${agent.email}):`, err.message)
            );
        }

        // 3. Notify admins
        const [admins] = await pool.query(`SELECT email FROM users WHERE role = 'admin'`);
        for (const admin of admins) {
            await sendWithRetry({
                to: admin.email,
                subject: `[Admin] New Booking #${bookingId} — ${serviceName}`,
                text: `New booking created.\n\nBooking #${bookingId}\nService: ${serviceName}\nCustomer: ${userName}\nDate: ${booking.date} at ${booking.time}\nAmount: ₹${booking.total_price}\n\nView: ${FRONTEND_URL}/admin-dashboard`,
            }).catch(err => logger.error(`[Email] Admin notify failed (${admin.email}):`, err.message));
        }

        logger.info(`[Email] ✅ Booking #${bookingId} notifications sent (user + ${agents.length} agents + ${admins.length} admins)`);
    } catch (err) {
        logger.error('[Email] sendNewBookingNotifications error:', err.message);
    }
};

module.exports = {
    verifySmtp,
    sendWithRetry,
    sendTestEmail,
    sendOtpEmail,
    sendForgotPasswordEmail,
    sendBookingConfirmationEmail,
    sendAgentNewBookingEmail,
    sendNewBookingNotifications,
    notifyUserServiceCompletedEmail,
    notifyUserPaymentSuccessEmail,
    // Legacy aliases kept for backward compat
    notifyAgentsNewBooking: () => {},
    notifyAdminNewBooking: () => {},
    notifyUserBookingCreated: () => {},
    notifyUserBookingAccepted: () => {},
};
