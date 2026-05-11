const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const ApiError = require('./utils/apiError');
require('dotenv').config();

// Fail fast if required environment variables are missing
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`[STARTUP] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// --- Sentry (error tracking) — initialise before routes ---
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0
  });
  logger.info('Sentry error tracking initialised');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Request correlation ID — included in all log lines and response headers
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// Strip $ and . operators from req.body/params/query to prevent NoSQL injection
app.use(mongoSanitize());

// Cut off requests that take longer than 15 s (M-4)
app.use(timeout('15s'));
app.use((req, res, next) => { if (!req.timedout) next(); });

// -----------------------------------------------------
// CORS — restrict to known frontend origins
// -----------------------------------------------------
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow any origin in the local network during development
    if (
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    // Explicitly allow production domain variations if in production
    const isProductionDomain = /^https?:\/\/(www\.)?baserabazar\.in$/.test(origin);
    
    if (allowedOrigins.includes(origin) || isProductionDomain) {
      return callback(null, true);
    }

    // Instead of throwing an Error (which causes 500), we return false to reject
    callback(null, false);
  },
  credentials: true
}));

// -----------------------------------------------------
// Body parsers — 100 KB for JSON/form; upload routes
// set their own higher limit via middleware
// -----------------------------------------------------
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// -----------------------------------------------------
// Rate limiters
// -----------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' }
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' }
});

// Structured HTTP request logging
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
}));

const connectDB = require('./config/db');

// Connect to Database
connectDB();

// -----------------------------------------------------
// IMPORT ROUTES
// -----------------------------------------------------
const authRoutes = require('./routes/authRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const listingRoutes = require('./routes/listingRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const financeRoutes = require('./routes/financeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminMarketplaceRoutes = require('./routes/adminMarketplaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushRoutes = require('./routes/pushRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const leadRoutes = require('./routes/leadRoutes');
const executiveRoutes = require('./routes/executiveRoutes');

// -----------------------------------------------------
// MOUNT ROUTES
// -----------------------------------------------------
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', enquiryRoutes); // Because enquiryRoutes handles both /api/enquiries and /api/users/enquiries
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/push', pushRoutes);

// Marketplace/Mandi Bazar Routes
app.use('/api/mandi', mandiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);
app.use('/api/leads', leadRoutes);


// Health check — returns 200 when all critical services are up, 503 otherwise
app.get('/api/health', async (req, res) => {
  const checks = {};
  let healthy = true;

  // MongoDB
  const dbState = mongoose.connection.readyState;
  checks.database = dbState === 1 ? 'ok' : 'degraded';
  if (dbState !== 1) healthy = false;

  // Redis (cache module exposes a ping helper)
  try {
    const { ping } = require('./utils/cache');
    checks.cache = (await ping()) ? 'ok' : 'degraded (in-memory fallback)';
  } catch {
    checks.cache = 'degraded (in-memory fallback)';
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks
  });
});

// Global error handler — catches unhandled Express errors
app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  logger.error({ err, requestId: req.id, url: req.url, method: req.method }, 'Unhandled Express error');

  if (err.isApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message
    });
  }

  res.status(err.status || 500).json({ success: false, message: 'An unexpected error occurred.' });
});

// Export the app so integration tests can import it without starting a server
module.exports = app;

// Don't start the HTTP server when running under Jest
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`BaseraBazar API running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.fatal(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.fatal({ err: error }, 'Server error');
    }
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close().then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      }).catch(() => process.exit(0));
    });
    setTimeout(() => {
      logger.fatal('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled promise rejection');
    gracefulShutdown('unhandledRejection');
  });
}
