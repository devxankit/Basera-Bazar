const express = require('express');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

// Shared Multer wrapper — runs upload.single('image') and surfaces a clean 400 on error
const handleMulter = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      logger.error({ err }, '[Upload] Multer error:');
      return res.status(400).json({
        success: false,
        message: err.message || 'Error during file upload. Ensure format is jpg/png/webp.',
      });
    }
    next();
  });
};

// Shared success handler — returns the Cloudinary URL
const sendUploadResult = (req, res) => {
  try {
    if (!req.file) {
      logger.warn({ contentType: req.headers['content-type'] }, '[Upload] Missing req.file.');
      return res.status(400).json({ success: false, message: 'Please upload a valid image file.' });
    }
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      url: req.file.path,
    });
  } catch (error) {
    logger.error({ err: error }, 'Upload error:');
    res.status(500).json({ success: false, message: 'Server error during upload.' });
  }
};

// Verify a short-lived signup token (e.g. exec_phone_verified) so KYC images can be
// uploaded during registration, before the account exists / the user is logged in.
const verifySignupToken = (req, res, next) => {
  const token = req.headers['x-signup-token'] || req.body?.signup_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Signup verification required to upload.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'exec_phone_verified') {
      return res.status(401).json({ success: false, message: 'Invalid signup token.' });
    }
    req.signupPhone = decoded.phone;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Signup session expired. Please restart registration.' });
  }
};

/**
 * @desc    Upload an image to Cloudinary and get the URL back
 * @route   POST /api/upload
 * @access  Private (Must be logged in to prevent spam uploads)
 */
router.post('/', protect, handleMulter, sendUploadResult);

/**
 * @desc    Upload a KYC image during signup (before the account exists)
 * @route   POST /api/upload/signup
 * @access  Signup-scoped — requires a valid phone-verified signup token
 */
router.post('/signup', verifySignupToken, handleMulter, sendUploadResult);

/**
 * @desc    Delete an image from Cloudinary by its URL
 * @route   DELETE /api/upload
 * @access  Private
 * @body    { url: "https://res.cloudinary.com/..." }
 */
router.delete('/', protect, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'Image URL is required.' });
  }

  try {
    // Extract the public_id from a Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<filename>.<ext>
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    if (!matches || !matches[1]) {
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL format.' });
    }

    const publicId = matches[1]; // e.g. "basera_bazar_uploads/abc123"
    logger.info(`[Upload] Deleting Cloudinary asset: ${publicId} for user: ${req.user?._id}`);

    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({ success: true, message: 'Image deleted successfully.' });
  } catch (error) {
    logger.error({ err: error }, "[Upload] Delete error:");
    res.status(500).json({ success: false, message: 'Failed to delete image.' });
  }
});

module.exports = router;
