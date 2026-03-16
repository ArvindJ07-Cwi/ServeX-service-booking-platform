const express = require('express');
const router = express.Router();
const { getServices, getServiceById, getCategories, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getServices);
router.get('/categories', getCategories);
router.get('/:id', getServiceById);
router.post('/', protect, admin, createService);
router.put('/:id', protect, admin, updateService);
router.delete('/:id', protect, admin, deleteService);

module.exports = router;
