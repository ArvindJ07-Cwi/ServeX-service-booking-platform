const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
    // For development, use ethereal email (fake SMTP)
    // For production, use real SMTP service (Gmail, SendGrid, etc.)
    
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
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

Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5174'}/agent-dashboard

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
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/agent-dashboard" 
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
${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin-dashboard

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
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin-dashboard" 
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
${process.env.FRONTEND_URL || 'http://localhost:5174'}/bookings/${booking.id}

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
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/bookings/${booking.id}" 
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
${process.env.FRONTEND_URL || 'http://localhost:5174'}/bookings/${booking.id}

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
            s.name as service_name, s.price as service_price,
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
        
        // Get all agents
        const [agents] = await pool.query('SELECT email FROM users WHERE role = "agent"');
        
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

module.exports = {
    notifyAgentsNewBooking,
    notifyAdminNewBooking,
    notifyUserBookingCreated,
    notifyUserBookingAccepted,
    sendNewBookingNotifications
};
