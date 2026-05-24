const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @desc    Upload an image to Cloudinary and get the URL back
 * @route   POST /api/upload
 * @access  Private (Must be logged in to prevent spam uploads)
 */
// We use the `upload.single('image')` middleware from Multer.
// `image` must match the key name the frontend uses in the FormData object.
router.post('/', protect, (req, res, next) => {
  logger.info(`[Upload] Request received from user: ${req.user?._id}`)
  upload.single('image')(req, res, (err) => {
    if (err) {
      logger.error({ err: err }, "[Upload] Multer error:")
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
      logger.warn({ err: req.body }, "[Upload] Missing req.file. Body:")
      logger.warn("[Upload] Headers:", req.headers['content-type'])
      return res.status(400).json({ success: false, message: 'Please upload a valid image file.' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      url: req.file.path
    });
  } catch (error) {
    logger.error({ err: error }, "Upload error:")
    res.status(500).json({ success: false, message: 'Server error during upload.' });
  }
});

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
