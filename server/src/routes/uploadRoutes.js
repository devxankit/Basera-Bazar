const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @desc    Upload an image to Cloudinary and get the URL back
 * @route   POST /api/upload
 * @access  Private (Must be logged in to prevent spam uploads)
 */
// We use the `upload.single('image')` middleware from Multer.
// `image` must match the key name the frontend uses in the FormData object.
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error during file upload. Ensure format is jpg/png/webp.' 
      });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid image file.' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      url: req.file.path
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: 'Server error during upload.' });
  }
});

module.exports = router;
