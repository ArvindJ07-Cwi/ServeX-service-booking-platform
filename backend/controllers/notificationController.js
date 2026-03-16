const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// Helper to create notification
const createNotification = async (userId, bookingId, type, title, message) => {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, booking_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
            [userId, bookingId, type, title, message]
        );
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const [notifications] = await pool.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
    );
    
    res.json(notifications.map(n => ({
        _id: n.id,
        bookingId: n.booking_id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read === 1,
        createdAt: n.created_at
    })));
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    const [result] = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [req.user.id]
    );
    
    res.json({ count: result[0].count });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
    );
    
    res.json({ message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [req.user.id]
    );
    
    res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    await pool.query(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
    );
    
    res.json({ message: 'Notification deleted' });
});

// Helper function to notify all agents about new booking
const notifyAgentsAboutNewBooking = async (bookingId, serviceName, userName, date, time) => {
    try {
        // Get all agents
        const [agents] = await pool.query('SELECT id FROM users WHERE role = "agent"');
        
        const title = 'New Booking Available';
        const message = `New booking for ${serviceName} by ${userName} on ${date} at ${time}`;
        
        // Create notification for each agent
        for (const agent of agents) {
            await createNotification(agent.id, bookingId, 'new_booking', title, message);
        }
        
        console.log(`✅ Notified ${agents.length} agents about booking #${bookingId}`);
    } catch (error) {
        console.error('Error notifying agents:', error);
    }
};

// Helper function to notify all admins about new booking
const notifyAdminsAboutNewBooking = async (bookingId, serviceName, userName, date, time, amount) => {
    try {
        // Get all admins
        const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin"');
        
        const title = 'New Booking Created';
        const message = `${userName} booked ${serviceName} for ${date} at ${time}. Amount: ₹${amount}`;
        
        // Create notification for each admin
        for (const admin of admins) {
            await createNotification(admin.id, bookingId, 'new_booking', title, message);
        }
        
        console.log(`✅ Notified ${admins.length} admins about booking #${bookingId}`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};

// Helper function to notify user about booking status change
const notifyUserAboutBookingStatus = async (userId, bookingId, status, serviceName, agentName = null) => {
    try {
        let title = '';
        let message = '';
        
        switch (status) {
            case 'accepted':
                title = 'Booking Accepted';
                message = `Your booking for ${serviceName} has been accepted by ${agentName}`;
                break;
            case 'in_progress':
                title = 'Service Started';
                message = `${agentName} has started working on your ${serviceName} service`;
                break;
            case 'completed':
                title = 'Service Completed';
                message = `Your ${serviceName} service has been completed`;
                break;
            case 'cancelled':
                title = 'Booking Cancelled';
                message = `Your booking for ${serviceName} has been cancelled`;
                break;
            default:
                return;
        }
        
        await createNotification(userId, bookingId, 'status_update', title, message);
        console.log(`✅ Notified user #${userId} about booking #${bookingId} status: ${status}`);
    } catch (error) {
        console.error('Error notifying user:', error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    notifyAgentsAboutNewBooking,
    notifyAdminsAboutNewBooking,
    notifyUserAboutBookingStatus
};
