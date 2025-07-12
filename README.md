# CI/CD Docker Deployment Setup Guide

This guide helps you set up automated deployment from GitHub to EC2 using Docker and GitHub Actions.

## 📋 Prerequisites

- [ ] EC2 instance running Ubuntu
- [ ] GitHub repository (private or public)
- [ ] Docker and Node.js project ready
- [ ] SSH key pair (.pem file) from AWS

## 🏗️ Project Structure

Your project should have:

```file Structure
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker-compose.yml
├── Dockerfile
├── package.json
└── your-app-files
```

## 🔧 Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2 with Docker

on:
    push:
        branches: [main, master]
    pull_request:
        branches: [main, master]

jobs:
    deploy:
        runs-on: ubuntu-latest

        steps:
            - name: Checkout code
              uses: actions/checkout@v3

            - name: Deploy to EC2
              uses: appleboy/ssh-action@v0.1.8
              with:
                host: ${{ secrets.EC2_HOST }}
                username: ${{ secrets.EC2_USER }}
                key: ${{ secrets.EC2_SSH_KEY }}
                script: |
                  cd /home/ubuntu/YOUR_PROJECT_NAME || git clone https://${{ secrets.GIT_TOKEN }}@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git /home/ubuntu/YOUR_PROJECT_NAME
                  cd /home/ubuntu/YOUR_PROJECT_NAME
                  git pull https://${{ secrets.GIT_TOKEN }}@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git main
                  
                  # Stop and remove containers completely
                  docker-compose down --remove-orphans
                  
                  # Remove old images to force rebuild
                  docker image prune -f
                  
                  # Build and start with fresh containers
                  docker-compose up --build -d --force-recreate
                  
                  # Clean up unused Docker resources
                  docker system prune -f
                  
                  # Show running containers for verification
                  docker ps
```

## 🔐 Step 2: Set Up GitHub Secrets

Go to GitHub Repository → **Settings** → **Secrets and variables** → **Actions**

Add these 4 secrets:

### 1. `EC2_HOST`

- **Value**: Your EC2 public IP address
- **Example**: `3.15.123.456`

### 2. `EC2_USER`

- **Value**: `ubuntu` (for Ubuntu instances)

### 3. `EC2_SSH_KEY`

- **Value**: Content of your `.pem` file (entire private key)
- **Format**:

```key format
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

### 4. `GIT_TOKEN` (For Private Repos)

- **Create Token**:
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token (classic)
  3. Select scope: `repo` (full repository access)
  4. Copy the token (starts with `ghp_...`)

## 🖥️ Step 3: Prepare EC2 Instance (One-Time Setup)

### SSH into EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Logout and login again for docker group to take effect
exit
```

### SSH Back In and Test

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Verify installations
docker --version
docker-compose --version
git --version

# Test docker without sudo
docker ps
```

## 🔧 Step 4: Configure EC2 Security Group

Make sure your EC2 security group allows:

- **Port 22** (SSH) - for deployment
- **Port 3000** (or your app port) - for your application
- **Port 80/443** (optional) - if using reverse proxy

## 🚀 Step 5: First Deployment

### Option A: Let GitHub Actions Clone (Recommended)

1. Push your code to GitHub
2. GitHub Actions will automatically clone and deploy

### Option B: Manual First Clone

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone manually (for private repos with token)
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git /home/ubuntu/YOUR_PROJECT_NAME

# Or clone with SSH (if SSH key is set up)
git clone git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git /home/ubuntu/YOUR_PROJECT_NAME

# Test deployment
cd /home/ubuntu/YOUR_PROJECT_NAME
docker-compose up --build -d
docker ps
```

## 🔄 How It Works

1. **Push Code** → GitHub repository
2. **GitHub Actions** triggers automatically
3. **SSH into EC2** using your secrets
4. **Pull latest code** from repository
5. **Stop old containers** completely
6. **Rebuild and restart** with new code
7. **Verify deployment** with docker ps

## 🧪 Testing Your Deployment

```bash
# Check if app is running
curl http://your-ec2-ip:3000

# Check health endpoint (if you have one)
curl http://your-ec2-ip:3000/health

# View container logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### GitHub Actions Fails

- Check if all 4 secrets are set correctly
- Verify EC2 is running and accessible
- Check Security Group allows port 22

### Container Not Updating

```bash
# SSH into EC2 and force restart
cd /home/ubuntu/YOUR_PROJECT_NAME
docker-compose down --remove-orphans
docker image prune -f
git pull
docker-compose up --build -d --force-recreate
```

### Permission Denied (Private Repo)

- Ensure `GIT_TOKEN` has `repo` scope
- Use HTTPS clone instead of SSH
- Verify token is not expired

### Docker Permission Denied

```bash
# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
# Logout and login again
exit
```

## 📊 Monitoring & Logging

This application includes comprehensive monitoring and logging setup:

### Prometheus Metrics

- **Endpoint**: `http://localhost:9090`
- Collects application metrics including HTTP requests, response times, and system metrics

### Grafana Dashboard

- **Endpoint**: `http://localhost:3001`
- Visualizes metrics from Prometheus
- Default credentials: admin/admin

### Loki Logging

- **Endpoint**: `http://localhost:3100`
- Centralized log aggregation using Winston and Loki
- Structured JSON logging with labels for easy querying

### Winston Logger Features

- Multiple log levels: error, warn, info, debug
- Automatic error and exception handling
- Request/response logging with metadata
- Loki integration for log aggregation
- Console output for development

### Testing Logs

Visit `http://localhost:3000/test-logs` to generate sample logs at different levels.

### Log Structure

```json
{
  "timestamp": "2025-07-12T10:30:00.000Z",
  "level": "info",
  "message": "HTTP Request",
  "service": "test-app-docker",
  "environment": "production",
  "method": "GET",
  "route": "/",
  "status": 200,
  "responseTime": 15.4,
  "ip": "172.18.0.1"
}
```

## 📝 Common Commands

```bash
# Check running containers
docker ps

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Clean up everything
docker system prune -a

# Check disk usage
docker system df
```

## 🎯 Production Recommendations

1. **Use environment variables** for sensitive data
2. **Set up reverse proxy** (Nginx) for port 80/443
3. **Configure SSL certificates** (Let's Encrypt)
4. **Set up monitoring** and health checks
5. **Use Docker secrets** for production credentials
6. **Implement blue-green deployment** for zero downtime

## 📚 Next Steps

- [ ] Add health check endpoints to your app
- [ ] Set up environment-specific configurations
- [ ] Configure logging and monitoring
- [ ] Add database backup strategies
- [ ] Implement staging environment

---

**Note**: Replace `YOUR_PROJECT_NAME`, `YOUR_USERNAME`, and `YOUR_REPO_NAME` with your actual values throughout this guide.

**Created**: June 19, 2025  
**Project**: CI/CD Docker Deployment Setup
