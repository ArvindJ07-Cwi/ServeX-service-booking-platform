const { pool } = require('../config/db');

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE role = "user"');
        const [[{ totalAgents }]] = await pool.query('SELECT COUNT(*) as totalAgents FROM users WHERE role = "agent"');
        const [[{ totalBookings }]] = await pool.query('SELECT COUNT(*) as totalBookings FROM bookings');
        
        const [[{ completedBookings }]] = await pool.query('SELECT COUNT(*) as completedBookings FROM bookings WHERE status = "completed"');
        const [[{ pendingBookings }]] = await pool.query('SELECT COUNT(*) as pendingBookings FROM bookings WHERE status IN ("pending", "assigned", "accepted", "in_progress")');
        
        // Revenue: Sum of platform_fee + tax + maybe total_price depending on definition. Let's just use total_price of paid bookings.
        const [[{ totalRevenue }]] = await pool.query('SELECT SUM(total_price) as totalRevenue FROM bookings WHERE payment_status = "paid"');

        return res.json({
            totalUsers,
            totalAgents,
            totalBookings,
            completedBookings,
            pendingBookings,
            totalRevenue: totalRevenue || 0
        });
    } catch (error) {
        console.error('Admin dashboard stats error:', error);
        return res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// @desc    Get all users (excluding admins, or include all roles)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id as _id, name, email, phone, role, created_at, availability_status 
            FROM users 
            WHERE role = 'user'
            ORDER BY created_at DESC
        `);
        return res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Get all agents
// @route   GET /api/admin/agents
// @access  Private/Admin
const getAllAgents = async (req, res) => {
    try {
        const [agents] = await pool.query(`
            SELECT id as _id, name, email, phone, role, location, city, area, service_category, availability_status, created_at 
            FROM users 
            WHERE role = 'agent'
            ORDER BY created_at DESC
        `);
        return res.json(agents);
    } catch (error) {
        console.error('Get all agents error:', error);
        return res.status(500).json({ message: 'Server error fetching agents' });
    }
};

// @desc    Update user/agent status (block/unblock/approve)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { availability_status } = req.body;
        // availability_status = false could mean blocked
        await pool.query('UPDATE users SET availability_status = ? WHERE id = ?', [availability_status, req.params.id]);
        return res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({ message: 'Server error updating user status' });
    }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(`
            SELECT id as booking_id, user_id, payment_id, order_id, total_price as amount, 
                   payment_status as status, date, time, created_at 
            FROM bookings 
            WHERE payment_id IS NOT NULL OR order_id IS NOT NULL
            ORDER BY created_at DESC
        `);
        return res.json(payments);
    } catch (error) {
        console.error('Get all payments error:', error);
        return res.status(500).json({ message: 'Server error fetching payments' });
    }
};

// @desc    Update booking status (Admin Override)
// @route   PATCH /api/admin/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Status is required' });

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        return res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Update booking status error:', error);
        return res.status(500).json({ message: 'Server error updating booking status' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getAllAgents,
    updateUserStatus,
    getAllPayments,
    updateBookingStatus
};
