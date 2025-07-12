const winston = require('winston');
const LokiTransport = require('winston-loki');

// Create Winston logger with Loki transport
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'test-app-docker',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Loki transport for log aggregation
    new LokiTransport({
      host: process.env.LOKI_HOST || 'http://loki:3100',
      labels: {
        app: 'test-app-docker',
        environment: process.env.NODE_ENV || 'development'
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      }
    })
  ],
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.Console(),
  new LokiTransport({
    host: process.env.LOKI_HOST || 'http://loki:3100',
    labels: {
      app: 'test-app-docker',
      type: 'exception'
    }
  })
);

logger.rejections.handle(
  new winston.transports.Console(),
  new LokiTransport({
    host: process.env.LOKI_HOST || 'http://loki:3100',
    labels: {
      app: 'test-app-docker',
      type: 'rejection'
    }
  })
);

module.exports = logger;
