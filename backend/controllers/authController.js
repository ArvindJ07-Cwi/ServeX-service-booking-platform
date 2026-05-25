const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');
const { pool } = require('../config/db');
const { sendForgotPasswordEmail } = require('../utils/emailService');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const [users] = await pool.query('SELECT id as _id, name, email, password_hash, role, phone, location, city, area, service_category, availability_status FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                location: user.location,
                city: user.city,
                area: user.area,
                service_category: user.service_category,
                availability_status: !!user.availability_status,
                token: generateToken(user._id, user.role),
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, location, city, area, service_category } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        const [userExists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Sanitize location inputs
        const safeCity = city ? String(city).trim().slice(0, 100) : null;
        const safeArea = area ? String(area).trim().slice(0, 100) : null;

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, phone, location, city, area, service_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, passwordHash, role || 'user', phone, location || safeCity || null, safeCity, safeArea, service_category || null]
        );

        if (result.insertId) {
            return res.status(201).json({
                _id: result.insertId,
                name,
                email,
                role: role || 'user',
                phone,
                location: location || safeCity || null,
                city: safeCity,
                area: safeArea,
                service_category: service_category || null,
                token: generateToken(result.insertId, role || 'user'),
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id as _id, name, email, role, phone, location, city, area, service_category, availability_status FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        if (user) {
            return res.json(user);
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile error:', error);
        return res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Forgot Password - request reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide email' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        // Always return generic message to prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: 'If that email is registered, you will receive a reset link shortly.' });
        }

        // Generate unhashed random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token to save in DB for security
        // Use sha256 to natively hash without bcrypt overhead since token is secure random string
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await pool.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [resetPasswordToken, resetPasswordExpires, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. \n\nPlease click on this link to complete the recovery:\n\n${resetUrl}\n\nThis link expires in 15 minutes.\nIf you did not request this, please ignore this email.`;

        try {
            await sendForgotPasswordEmail(user, resetUrl);

            return res.status(200).json({ message: 'If that email is registered, you will receive a reset link shortly.' });
        } catch (error) {
            // Revert db fields if email couldn't trigger reliably
            await pool.query(
                'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
                [user.id]
            );
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error during forgot password' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Allow 30 seconds extra for safety matching clock drift safely
        const [users] = await pool.query(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [hashedToken]
        );
        
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid or Expired Reset Token' });
        }

        // Hash new password robustly safely
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update user payload and nullify reset fields securely
        await pool.query(
            'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
            [passwordHash, user.id]
        );

        return res.status(200).json({ message: 'Password has been successfully reset! You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Server error resetting password' });
    }
};

module.exports = { authUser, registerUser, getUserProfile, forgotPassword, resetPassword };
