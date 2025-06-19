# Sample Node.js app with Docker

## Quick Start (for team members)

1. **Run with Docker Compose** (Recommended):
   ```bash
   # Download this docker-compose.yml file
   # Then run:
   docker-compose up
   ```

2. **Run with Docker only** (Advanced - requires manual database setup):
   ```bash
   # First: Start MongoDB
   docker run -d --name my-mongo \
     -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
     mongo:latest

   # Then: Start the app
   docker run -p 3000:3000 \
     -e MONGO_URI=mongodb://admin:admin123@localhost:27017/ \
     tellyoudoc/test-app-with-docker:latest
   ```
   **Note:** This method requires manual database setup and is more complex.

3. **Access the application**:
   - App: http://localhost:3000
   - Database Health: http://localhost:3000/db
   - Mongo Express: http://localhost:8081 (admin/pass)

## For Developers

### Build and run locally:
```bash
docker build -t test-app .
docker run -p 3000:3000 test-app
```

### Full development setup:
```bash
git clone [repository-url]
cd test-app-with-docker
docker-compose up --build
```

## Requirements
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
