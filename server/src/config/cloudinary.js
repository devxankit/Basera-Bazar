// Import the required packages
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Step 1: Configure Cloudinary with your Account Details from the .env file
// This tells the cloudinary package "who" is trying to upload files to "what" account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Step 2: Set up the Storage Engine for Multer
// Multer is a middleware that handles 'multipart/form-data' (file uploads).
// We use CloudinaryStorage so that instead of saving the image to your computer,
// Multer sends it directly to your Cloudinary cloud bucket.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // This is the specific folder inside your Cloudinary account where images will live
    folder: 'basera_bazar_uploads', 
    
    // Explicitly support both JPG and JPEG, and set resource_type to auto
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'], 
    resource_type: 'auto',
    
    // Optional setting: You can add transformations here (e.g., resizing before saving)
    // transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max (H-3)
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only jpg, png, webp, and pdf files are allowed.'));
    }
    cb(null, true);
  }
});

module.exports = { cloudinary, upload };
