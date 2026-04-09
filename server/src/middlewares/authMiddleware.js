const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware: Protect Routes
 * This middleware checks if a user has a valid JWT token in their request headers.
 * If they do, it decodes the token and attaches the user info to the `req` object.
 * If they don't, it blocks the request.
 */
const protect = (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with 'Bearer'
  // Example header: "Authorization: Bearer xyz123token"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split the string and grab the actual token part ('xyz123token')
      token = req.headers.authorization.split(' ')[1];

      // Decode the token using our secret key to verify it hasn't been tampered with
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the decoded user data to the request object so the next route can use it!
      req.user = decoded;
      
      // Move on to the actual router function
      next();
    } catch (error) {
      console.error("JWT Verification Failed:", error.message);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    // If no token was found at all
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware: Role Authorization
 * This checks if the user mapped to `req.user` has one of the allowed roles.
 * Must be used AFTER the `protect` middleware.
 * 
 * Example usage: router.post('/do-admin-stuff', protect, authorizeRoles('super_admin'), adminController.doThings)
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the current user's role is in the array of allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role (${req.user.role}) is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
