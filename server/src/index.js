const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
require('dotenv').config();

// Fail fast if required environment variables are missing
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'NODE_ENV'];
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
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

// Security headers — tightened for a pure JSON API (no HTML served)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],      // block all resource loading
      frameAncestors: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      childSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // not relevant for an API
}));

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
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // 2. Normalize origin for comparison (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // 3. Check if it's a known production domain (baserabazar.in or its subdomains)
    const isProductionDomain = normalizedOrigin === 'https://baserabazar.in' || 
                               normalizedOrigin === 'https://www.baserabazar.in' ||
                               normalizedOrigin.endsWith('.baserabazar.in');

    if (isProductionDomain) return callback(null, true);

    // 4. Check explicitly allowed origins from .env
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);

    // 5. Allow localhost and local network in development
    if (process.env.NODE_ENV !== 'production') {
      if (
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
    }

    // 6. Reject otherwise
    logger.warn({ origin: normalizedOrigin }, 'CORS request blocked');
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200 // Essential for some legacy environments
}));

// Cookie parser — must come before routes so req.cookies is populated
app.use(cookieParser());

// -----------------------------------------------------
// Body parsers — 100 KB for JSON/form; upload routes
// set their own higher limit via middleware
// -----------------------------------------------------
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

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

// Initialize Monthly Salary Deduction Scheduler
const { scheduleMonthlyDeduction } = require('./jobs/monthlyDeductionJob');
scheduleMonthlyDeduction();

const { scheduleSubscriptionExpiryJob } = require('./jobs/subscriptionExpiryJob');
scheduleSubscriptionExpiryJob();

// One-time backfill: populate staff_model field on existing documents for dynamic refPath population
setTimeout(async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const LeaveRequest = mongoose.model('LeaveRequest');
    const StaffAttendance = mongoose.model('StaffAttendance');
    const DailyReport = mongoose.model('DailyReport');
    const StaffPerformance = mongoose.model('StaffPerformance');
    const SalaryRecord = mongoose.model('SalaryRecord');

    const backfillInfo = [
      { model: LeaveRequest, field: 'staff_model', typeField: 'staff_type' },
      { model: StaffAttendance, field: 'staff_model', typeField: 'staff_type' },
      { model: DailyReport, field: 'staff_model', typeField: 'staff_type' },
      { model: StaffPerformance, field: 'staff_model', typeField: 'staff_type' },
      { model: SalaryRecord, field: 'staff_model', typeField: 'staff_type' }
    ];

    let totalUpdated = 0;
    for (const item of backfillInfo) {
      const r1 = await item.model.updateMany({ [item.typeField]: 'team_leader', [item.field]: { $exists: false } }, { [item.field]: 'TeamLeader' });
      const r2 = await item.model.updateMany({ [item.typeField]: { $in: ['field_executive', 'executive'] }, [item.field]: { $exists: false } }, { [item.field]: 'Executive' });
      const r3 = await item.model.updateMany({ [item.typeField]: 'office_staff', [item.field]: { $exists: false } }, { [item.field]: 'OfficeStaff' });
      totalUpdated += (r1.modifiedCount || 0) + (r2.modifiedCount || 0) + (r3.modifiedCount || 0);
    }

    if (totalUpdated > 0) {
      logger.info(`[BACKFILL] Populated staff_model for ${totalUpdated} legacy staff records.`);
    }
  } catch (err) {
    logger.error({ err }, '[BACKFILL] staff_model backfill failed');
  }
}, 5000);

// One-time backfill: grant free trials to already-approved partners with no subscription
setTimeout(async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const { Partner } = require('./models/Partner');
    const { grantFreeTrial } = require('./utils/trialHelper');
    const orphans = await Partner.find({
      onboarding_status: 'approved',
      active_subscription_id: null,
      subscription_expired: { $ne: true },
    }).select('_id').lean();
    for (const p of orphans) {
      await grantFreeTrial(p._id);
    }
    if (orphans.length > 0) {
      logger.info(`[BACKFILL] Granted free trials to ${orphans.length} existing partners.`);
    }
  } catch (err) {
    logger.error({ err }, '[BACKFILL] Free trial backfill failed');
  }
}, 20000);

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
const staffAuthRoutes = require('./routes/staffAuthRoutes');
const adminStaffRoutes = require('./routes/adminStaffRoutes');
const teamLeaderRoutes = require('./routes/teamLeaderRoutes');
const officeStaffRoutes = require('./routes/officeStaffRoutes');

// -----------------------------------------------------
// RATE LIMITING
// -----------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
});

const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded on this endpoint.' },
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
});

app.use('/api', globalLimiter);
app.use('/api/orders/checkout', heavyLimiter);
app.use('/api/finance/subscription/initiate', heavyLimiter);
app.use('/api/wallet/withdraw', heavyLimiter);

// -----------------------------------------------------
// MOUNT ROUTES
// -----------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/auth/staff', staffAuthRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/team-leader', teamLeaderRoutes);
app.use('/api/office-staff', officeStaffRoutes);
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
app.use((err, req, res, _next) => {
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
    const exitCode = (signal === 'SIGINT' || signal === 'SIGTERM') ? 0 : 1;
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close().then(() => {
        logger.info('MongoDB connection closed');
        process.exit(exitCode);
      }).catch(() => process.exit(exitCode));
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
// Trigger dev reload - restart server fresh
