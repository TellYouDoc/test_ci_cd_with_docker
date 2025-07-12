# Winston Logging with Loki Integration

## Overview
Successfully implemented Winston logging with Loki transport for centralized log aggregation in a Docker-based Node.js application.

## Components Added

### 1. Winston Dependencies
- **winston**: Core logging library
- **winston-loki**: Transport for sending logs to Loki

### 2. Logger Configuration (`logger.js`)
- Structured JSON logging with timestamps
- Multiple transports:
  - Console (for development/debugging)
  - Loki (for centralized log aggregation)
- Automatic error and exception handling
- Environment-based configuration

### 3. Application Integration (`index.js`)
- Logger integrated into Express app
- Request/response logging middleware
- Error handling middleware
- Test endpoint for log generation (`/test-logs`)

### 4. Docker Configuration
- Updated `docker-compose.yml` with Loki service
- Environment variables for Loki connection
- Volume persistence for Loki data

## Features

### Log Levels
- **debug**: Detailed debugging information
- **info**: General application information
- **warn**: Warning messages
- **error**: Error messages with stack traces

### Log Structure
```json
{
  "timestamp": "2025-07-12T07:22:25.603Z",
  "level": "info",
  "message": "HTTP Request",
  "service": "test-app-docker",
  "environment": "production",
  "method": "GET",
  "route": "/test-logs",
  "status": 200,
  "responseTime": 2.85,
  "ip": "::ffff:172.18.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Loki Labels
- `app`: Application identifier
- `environment`: Runtime environment (production/development)
- `level`: Log level
- `service_name`: Service identifier

## Endpoints

### Application Endpoints
- `http://localhost:3000/` - Main application
- `http://localhost:3000/health` - Health check
- `http://localhost:3000/status` - Status with logging
- `http://localhost:3000/test-logs` - Generate test logs
- `http://localhost:3000/metrics` - Prometheus metrics

### Monitoring Endpoints
- `http://localhost:3100` - Loki (log aggregation)
- `http://localhost:9090` - Prometheus (metrics)
- `http://localhost:3001` - Grafana (visualization)

## Usage

### Starting the Stack
```bash
docker-compose up --build
```

### Testing Logs
```bash
# Generate test logs
curl http://localhost:3000/test-logs

# Check Loki labels
curl http://localhost:3100/loki/api/v1/labels

# Query logs from Loki
curl "http://localhost:3100/loki/api/v1/query_range?query=%7Bapp%3D%22test-app-docker%22%7D&start=1673528400000000000&end=1673532000000000000"
```

### Viewing Logs
1. **Container logs**: `docker logs test_app_docker_git_CiCd`
2. **Loki API**: Query through HTTP API endpoints
3. **Grafana**: Configure Loki data source for visualization

## Configuration

### Environment Variables
- `LOG_LEVEL`: Set logging level (debug, info, warn, error)
- `LOKI_HOST`: Loki server URL (default: http://loki:3100)
- `NODE_ENV`: Application environment

### Production Considerations
- Log rotation and retention policies
- Performance impact monitoring
- Security (log sanitization)
- Network connectivity between services

## Benefits
- **Centralized Logging**: All logs in one place
- **Structured Data**: JSON format for easy parsing
- **Real-time Monitoring**: Immediate log availability
- **Scalability**: Handles high-volume logging
- **Integration**: Works with Grafana for visualization
- **Docker Native**: Designed for containerized environments
