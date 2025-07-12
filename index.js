const express = require('express');
const responseTime = require('response-time');
const logger = require('./logger');
// require('./mongo-connection');
const app = express();
const PORT = process.env.PORT || 3000;
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register, timeout: 5000 });

const { Counter, Gauge, Histogram } = client;
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
const responseTimeGauge = new Gauge({
  name: 'http_response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['method', 'route', 'status']
});
const requestDurationHistogram = new Histogram({
  name: 'http_request_duration_seconds',  
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10] // Custom buckets for response time
});

app.use(responseTime((req, res, time) => {
  const route = req.route ? req.route.path : 'unknown';
  const logData = {
    method: req.method,
    route: route,
    status: res.statusCode,
    responseTime: time,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };
  
  // Log request information
  if (res.statusCode >= 400) {
    logger.error('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
  
  responseTimeGauge.labels(
    req.method, 
    route,
    res.statusCode
  ).set(time / 1000);
  requestDurationHistogram.labels(
    req.method, 
    route,
    res.statusCode
  ).observe(time / 1000);
  requestCounter.labels(
    req.method, 
    route,
    res.statusCode
  ).inc();
}));

app.get('/metrics', async (req, res) => {
  try {
    logger.debug('Metrics endpoint accessed');
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    logger.error('Error collecting metrics', { error: ex.message, stack: ex.stack });
    res.status(500).
      end(`Error collecting metrics: ${ex.message}`);
  }
});



app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.send('Hello from Dockerized Node.js app!');
});

app.get('/health', (req, res) => {
  logger.debug('Health check endpoint accessed');
  res.status(200).send('OK');
});

app.get('/status', (req, res) => {
  const statusData = { status: 'running', timestamp: new Date() };
  logger.info('Status endpoint accessed', statusData);
  res.status(200).json(statusData);
});

// Test logging endpoint
app.get('/test-logs', (req, res) => {
  logger.debug('Debug log test');
  logger.info('Info log test', { requestId: Math.random().toString(36) });
  logger.warn('Warning log test', { warning: 'This is a test warning' });
  logger.error('Error log test', { error: 'This is a test error', code: 'TEST_ERROR' });
  
  res.json({
    message: 'Logs generated successfully',
    logs: ['debug', 'info', 'warn', 'error'],
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 errors
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

app.listen(PORT, () => {
  logger.info(`Server started successfully`, { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  console.log(`Server running on port ${PORT}`);
});
