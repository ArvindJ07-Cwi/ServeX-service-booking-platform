const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // multer-storage-cloudinary provides the path to the uploaded file on cloudinary
    res.json({
        message: 'Image uploaded successfully',
        imageUrl: req.file.path,
    });
});

module.exports = router;
