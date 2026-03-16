const express = require('express');
const router = express.Router();
const { getAllUsers, getProfile, updateProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Profile routes (must be before any /:id param routes)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/', protect, admin, getAllUsers);

module.exports = router;
