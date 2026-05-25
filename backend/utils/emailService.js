const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
    // If SMTP_USER is provided in .env, use real SMTP (works in both dev and prod)
    if (process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Development mode - log to console instead of sending
        return {
            sendMail: async (mailOptions) => {
                console.log('\n📧 EMAIL NOTIFICATION:');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                console.log('Body:', mailOptions.text);
                console.log('---\n');
                return { messageId: 'dev-' + Date.now() };
            }
        };
    }
};

// Send booking notification to agents
const notifyAgentsNewBooking = async (booking, user, service) => {
    const transporter = createTransporter();
    
    const subject = `New Booking Request - ${service.name}`;
    const text = `
Hello Agent,

A new booking request has been received:

Booking ID: #${booking.id}
Service: ${service.name}
Customer: ${user.name}
Date: ${booking.date}
Time: ${booking.time}
Location: ${booking.address}
Amount: ₹${booking.total_price}

Please login to your agent dashboard to accept this booking.

Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent-dashboard

Thank you,
ServeX Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">New Booking Request</h2>
            <p>Hello Agent,</p>
            <p>A new booking request has been received:</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Customer:</strong> ${user.name}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>Amount:</strong> ₹${booking.total_price}</p>
            </div>
            
            <p>Please login to your agent dashboard to accept this booking.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent-dashboard" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
                View Dashboard
            </a>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Thank you,<br>
                ServeX Team
            </p>
        </div>
    `;

    // In production, get all agent emails from database
    // For now, we'll return the email options
    return {
        subject,
        text,
        html
    };
};

// Send booking notification to admin
const notifyAdminNewBooking = async (booking, user, service) => {
    const transporter = createTransporter();
    
    const subject = `New Booking - ${service.name} by ${user.name}`;
    const text = `
Hello Admin,

A new booking has been created:

Booking ID: #${booking.id}
Service: ${service.name}
Customer: ${user.name} (${user.email})
Date: ${booking.date}
Time: ${booking.time}
Location: ${booking.address}
Amount: ₹${booking.total_price}
Status: Pending

View details in admin dashboard:
${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard

ServeX Platform
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC2626;">New Booking Created</h2>
            <p>Hello Admin,</p>
            <p>A new booking has been created on the platform:</p>
            
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>Amount:</strong> ₹${booking.total_price}</p>
                <p><strong>Status:</strong> <span style="color: #F59E0B;">Pending</span></p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard" 
               style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
                View Admin Dashboard
            </a>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                ServeX Platform
            </p>
        </div>
    `;

    return {
        subject,
        text,
        html
    };
};

// Send booking confirmation to user
const notifyUserBookingCreated = async (booking, user, service) => {
    const transporter = createTransporter();
    
    const subject = `Booking Confirmed - ${service.name}`;
    const text = `
Hello ${user.name},

Your booking has been confirmed!

Booking ID: #${booking.id}
Service: ${service.name}
Date: ${booking.date}
Time: ${booking.time}
Location: ${booking.address}
Amount: ₹${booking.total_price}

Status: Pending (Waiting for agent to accept)

You will receive a notification once an agent accepts your booking.

View booking details:
${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}

Thank you for choosing ServeX!
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Booking Confirmed!</h2>
            <p>Hello ${user.name},</p>
            <p>Your booking has been confirmed!</p>
            
            <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>Amount:</strong> ₹${booking.total_price}</p>
                <p><strong>Status:</strong> <span style="color: #F59E0B;">Pending</span></p>
            </div>
            
            <p>You will receive a notification once an agent accepts your booking.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}" 
               style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
                View Booking Details
            </a>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Thank you for choosing ServeX!
            </p>
        </div>
    `;

    return {
        to: user.email,
        subject,
        text,
        html
    };
};

// Send notification when agent accepts booking
const notifyUserBookingAccepted = async (booking, user, agent, service) => {
    const subject = `Booking Accepted - ${service.name}`;
    const text = `
Hello ${user.name},

Great news! Your booking has been accepted by an agent.

Booking ID: #${booking.id}
Service: ${service.name}
Agent: ${agent.name}
Agent Phone: ${agent.phone || 'N/A'}
Date: ${booking.date}
Time: ${booking.time}

The agent will arrive at your location at the scheduled time.

View booking details:
${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}

Thank you,
ServeX Team
    `;

    return {
        to: user.email,
        subject,
        text
    };
};

// Send all notifications for a new booking
const sendNewBookingNotifications = async (bookingId, pool) => {
    try {
        // Fetch complete booking details
        const query = `
            SELECT b.*, 
            s.name as service_name, s.price as service_price, s.category as service_category,
            u.name as user_name, u.email as user_email
            FROM bookings b 
            JOIN services s ON b.service_id = s.id 
            JOIN users u ON b.user_id = u.id 
            WHERE b.id = ?
        `;
        const [bookings] = await pool.query(query, [bookingId]);
        
        if (!bookings.length) {
            console.error('Booking not found for notifications');
            return;
        }
        
        const booking = bookings[0];
        const user = {
            name: booking.user_name,
            email: booking.user_email
        };
        const service = {
            name: booking.service_name,
            price: booking.service_price
        };
        
        // Get matching agents based on service category
        let [agents] = await pool.query(
            'SELECT email FROM users WHERE role = "agent" AND LOWER(service_category) = LOWER(?)',
            [booking.service_category]
        );
        
        // If no matching category, don't spam ALL agents via email (too noisy).
        // The in-app notification handles the fallback.
        
        // Get all admins
        const [admins] = await pool.query('SELECT email FROM users WHERE role = "admin"');
        
        const transporter = createTransporter();
        
        // Send to user
        const userEmail = await notifyUserBookingCreated(booking, user, service);
        await transporter.sendMail(userEmail);
        
        // Send to all agents
        const agentEmail = await notifyAgentsNewBooking(booking, user, service);
        for (const agent of agents) {
            await transporter.sendMail({
                to: agent.email,
                ...agentEmail
            });
        }
        
        // Send to all admins
        const adminEmail = await notifyAdminNewBooking(booking, user, service);
        for (const admin of admins) {
            await transporter.sendMail({
                to: admin.email,
                ...adminEmail
            });
        }
        
        console.log(`✅ Notifications sent for booking #${bookingId}`);
        
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
};

// Send payment success notification to user
const notifyUserPaymentSuccessEmail = async (user, booking, service) => {
    const transporter = createTransporter();
    
    const subject = `Payment Successful - ${service.name}`;
    const text = `
Hello ${user.name},

Your payment of ₹${booking.total_price} for ${service.name} was successful.

Booking ID: #${booking.id}
Service: ${service.name}
Amount Paid: ₹${booking.total_price}

Thank you for using ServeX!
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Payment Successful!</h2>
            <p>Hello ${user.name},</p>
            <p>Your payment of ₹${booking.total_price} for ${service.name} was successful.</p>
            
            <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Amount Paid:</strong> ₹${booking.total_price}</p>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Thank you for using ServeX!
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            to: user.email,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error('Error sending payment success email:', error);
    }
};

// Send forgot password email
const sendForgotPasswordEmail = async (user, resetUrl) => {
    const transporter = createTransporter();
    
    const subject = 'Password Reset Request';
    const text = `
Hello ${user.name},

You requested to reset your password. Click the link below to reset it:
${resetUrl}

If you did not request a password reset, please ignore this email.
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You recently requested to reset your password for your ServeX account.</p>
            
            <a href="${resetUrl}" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Reset Password
            </a>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                ServeX Team
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            to: user.email,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error('Error sending forgot password email:', error);
        throw error; // Throw so authController can catch it
    }
};

// Send service completed notification to user
const notifyUserServiceCompletedEmail = async (user, booking, service) => {
    const transporter = createTransporter();
    
    const subject = `Service Completed - ${service.name}`;
    const text = `
Hello ${user.name},

Your service for ${service.name} has been completed!

Booking ID: #${booking.id}
Service: ${service.name}

Thank you for choosing ServeX. We hope you enjoyed the service!
Please consider leaving a review on our platform.
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Service Completed!</h2>
            <p>Hello ${user.name},</p>
            <p>Your service for <strong>${service.name}</strong> has been marked as completed.</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Service:</strong> ${service.name}</p>
            </div>
            
            <p>Thank you for choosing ServeX. We hope you enjoyed the service!</p>
            <p>Please consider leaving a review on our platform.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
                View Booking
            </a>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                ServeX Team
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            to: user.email,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error('Error sending service completed email:', error);
    }
};

module.exports = {
    notifyAgentsNewBooking,
    notifyAdminNewBooking,
    notifyUserBookingCreated,
    notifyUserBookingAccepted,
    sendNewBookingNotifications,
    notifyUserPaymentSuccessEmail,
    sendForgotPasswordEmail,
    notifyUserServiceCompletedEmail
};
