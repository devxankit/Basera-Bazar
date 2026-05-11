const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname', translateTime: 'HH:MM:ss' }
    }
  })
});

module.exports = logger;
