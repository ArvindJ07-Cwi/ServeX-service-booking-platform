const express = require('express');
const router = express.Router();
const { getAllUsers, getProfile, updateProfile, getAvailableAgents } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Profile routes (must be before any /:id param routes)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Agent filtering — public so checkout can query available agents
router.get('/agents', getAvailableAgents);

router.get('/', protect, admin, getAllUsers);

module.exports = router;
