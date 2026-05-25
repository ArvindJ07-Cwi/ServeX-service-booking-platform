const { pool } = require('../config/db');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id as _id, name, email, role, phone, location, city, area, service_category, availability_status, created_at FROM users');
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
        const [users] = await pool.query('SELECT id as _id, name, email, role, phone, location, city, area, service_category, availability_status, created_at FROM users WHERE id = ?', [req.user.id]);
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
        const { name, phone, location, city, area, service_category, availability_status } = req.body;

        // Sanitize location inputs server-side
        const safeCity = city !== undefined ? (city ? String(city).trim().slice(0, 100) : null) : undefined;
        const safeArea = area !== undefined ? (area ? String(area).trim().slice(0, 100) : null) : undefined;

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        await pool.query(
            'UPDATE users SET name = ?, phone = ?, location = ?, city = ?, area = ?, service_category = ?, availability_status = ? WHERE id = ?',
            [
                name || users[0].name,
                phone !== undefined ? phone : users[0].phone,
                location !== undefined ? location : users[0].location,
                safeCity !== undefined ? safeCity : users[0].city,
                safeArea !== undefined ? safeArea : users[0].area,
                service_category !== undefined ? service_category : users[0].service_category,
                availability_status !== undefined ? availability_status : users[0].availability_status,
                req.user.id
            ]
        );

        const [updated] = await pool.query('SELECT id as _id, name, email, role, phone, location, city, area, service_category, availability_status, created_at FROM users WHERE id = ?', [req.user.id]);
        return res.json(updated[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Get available agents filtered by location and/or service category
// @route   GET /api/users/agents?location=Thane&category=Cleaning
// @access  Public (or protect if needed)
const getAvailableAgents = async (req, res) => {
    try {
        const { location, city, category } = req.query;

        let query = `SELECT id as _id, name, email, phone, location, city, area, service_category, availability_status 
                      FROM users WHERE role = 'agent' AND availability_status = TRUE`;
        const params = [];

        // Prefer city filter; fall back to legacy location filter
        if (city) {
            query += ` AND (LOWER(city) = LOWER(?) OR (city IS NULL AND LOWER(location) = LOWER(?)))`;
            params.push(city, city);
        } else if (location) {
            query += ` AND LOWER(location) = LOWER(?)`;
            params.push(location);
        }

        if (category) {
            query += ` AND LOWER(service_category) = LOWER(?)`;
            params.push(category);
        }

        query += ` ORDER BY name ASC`;

        const [agents] = await pool.query(query, params);
        return res.json({ agents });
    } catch (error) {
        console.error('Get available agents error:', error);
        return res.status(500).json({ message: 'Server error fetching agents' });
    }
};

module.exports = { getAllUsers, getProfile, updateProfile, getAvailableAgents };
