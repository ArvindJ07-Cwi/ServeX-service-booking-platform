const { pool } = require('../config/db');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id as _id, name, email, role, phone, created_at FROM users');
        return res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id as _id, name, email, role, phone, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users[0]) {
            return res.json(users[0]);
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
            name || users[0].name,
            phone !== undefined ? phone : users[0].phone,
            req.user.id
        ]);

        const [updated] = await pool.query('SELECT id as _id, name, email, role, phone, created_at FROM users WHERE id = ?', [req.user.id]);
        return res.json(updated[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Server error updating profile' });
    }
};

module.exports = { getAllUsers, getProfile, updateProfile };

