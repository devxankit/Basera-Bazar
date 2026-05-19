const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

const { AdminUser } = require('../models/Admin');
const { User } = require('../models/User');
const { Partner } = require('../models/Partner');
const Executive = require('../models/Executive');
const { TeamLeader, OfficeStaff } = require('../models/Staff');

async function resolveUserFromDecoded(decoded) {
  if (decoded.role === 'super_admin' || decoded.role === 'SuperAdmin') {
    return AdminUser.findById(decoded.id).select('-password');
  }
  if (decoded.role === 'partner') {
    return Partner.findById(decoded.id).select('-password').populate('active_subscription_id');
  }
  if (decoded.role === 'executive') {
    return Executive.findById(decoded.id).select('-password');
  }
  if (decoded.role === 'team_leader') {
    return TeamLeader.findById(decoded.id).select('-password');
  }
  if (decoded.role === 'office_staff') {
    return OfficeStaff.findById(decoded.id).select('-password');
  }
  return User.findById(decoded.id).select('-password');
}

function attachUser(req, userFound, tokenRole) {
  req.user = userFound.toObject();
  req.user._id = userFound._id;
  req.user.id = userFound._id.toString();

  if (tokenRole === 'partner') {
    req.user.db_role = req.user.role;
    req.user.role = 'partner';
  } else if (tokenRole === 'executive') {
    req.user.role = 'executive';
  } else if (tokenRole === 'team_leader') {
    req.user.role = 'team_leader';
  } else if (tokenRole === 'office_staff') {
    req.user.role = 'office_staff';
  }
}

/**
 * Middleware: Protect Routes — blocks unauthenticated or invalid token requests.
 *
 * Token resolution order:
 *   1. Authorization: Bearer <token>  (API clients, mobile localStorage fallback)
 *   2. bb_access HttpOnly cookie      (browser PWA — persistent across app kills)
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.bb_access) {
    token = req.cookies.bb_access;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userFound = await resolveUserFromDecoded(decoded);

    if (!userFound) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (userFound.onboarding_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    if (userFound.is_active === false && !req.originalUrl.endsWith('/logout')) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Token version check: if the token carries a version, it must match the DB record.
    // Increment token_version on the user document to invalidate all existing sessions.
    if (decoded.version !== undefined && decoded.version !== userFound.token_version) {
      return res.status(401).json({ success: false, message: 'Session expired. Please re-login.' });
    }

    attachUser(req, userFound, decoded.role);
    next();
  } catch (error) {
    logger.error({ err: error.message }, 'JWT Verification Failed:');
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware: Role Authorization — must be used after `protect`.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource`
      });
    }
    next();
  };
};

/**
 * Middleware: Optional auth — sets req.user if a valid token is present, otherwise continues.
 */
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.bb_access) {
    token = req.cookies.bb_access;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userFound = await resolveUserFromDecoded(decoded);
      if (userFound) attachUser(req, userFound, decoded.role);
    } catch (_) {
      // Invalid/expired token in optional context — proceed without user
    }
  }
  next();
};

/**
 * Middleware: Verify approved account.
 * Partners must be approved by admin; executives must be approved or verified.
 */
const verifyApproved = (req, res, next) => {
  if (req.user.role === 'partner') {
    if (req.user.onboarding_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your account is not yet verified by the Admin. Please complete your profile and wait for approval.'
      });
    }
    if (req.user.subscription_expired === true) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew your plan to add or edit listings.'
      });
    }
  }

  if (req.user.role === 'executive') {
    if (!['approved', 'verified'].includes(req.user.onboarding_status)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your account is not yet approved. Please complete your profile and wait for approval.'
      });
    }
  }

  if (req.user.role === 'team_leader' || req.user.role === 'office_staff') {
    if (req.user.onboarding_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your account is not yet approved by the Admin.'
      });
    }
  }

  next();
};

module.exports = { protect, authorizeRoles, optionalProtect, verifyApproved };
