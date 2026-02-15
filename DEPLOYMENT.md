# LUMYN Deployment Guide

Complete guide for deploying LUMYN Messenger to production environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Build](#production-build)
3. [Docker Deployment](#docker-deployment)
4. [Server Deployment](#server-deployment)
5. [Cloud Platforms](#cloud-platforms)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] TypeScript compilation clean: `npm run build`
- [ ] Git repository clean: `git status`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] No sensitive data in code
- [ ] API keys in environment variables only

### Security
- [ ] All dependencies up-to-date: `npm audit`
- [ ] HTTPS enabled in production
- [ ] JWT secret is strong (32+ characters)
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Authentication enforced

### Performance
- [ ] Frontend properly optimized
- [ ] Database indexes created
- [ ] MongoDB connection pooling configured
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented
- [ ] Load balancing configured (if needed)

### Backup & Disaster Recovery
- [ ] Database backup plan in place
- [ ] Backup restoration tested
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Disaster recovery plan documented

---

## Production Build

### Building for Distribution

```bash
# Install dependencies
npm install

# Run lint check
npm run lint

# Run tests
npm test

# Build frontend and backend
npm run build
```

### Build Output

```
dist/
├── main/              # Electron main process
├── preload/           # Electron preload scripts
└── renderer/          # React frontend build
release/
├── LUMYN-Messenger-1.0.0.exe    # Windows installer
├── LUMYN-Messenger-1.0.0.dmg    # macOS installer
└── lumyn-messenger-1.0.0.AppImage # Linux executable
```

### Build for Specific Platforms

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

---

## Docker Deployment

### Quick Docker Start

```bash
# Build image
docker build -t lumyn-messenger:1.0.0 .

# Run container
docker run -d \
  -p 4777:4777 \
  -e MONGODB_URI=mongodb://mongo:27017/lumyn \
  -e NODE_ENV=production \
  --name lumyn \
  lumyn-messenger:1.0.0
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Backup database
docker-compose exec mongo mongodump --out /backup
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  app:
    image: lumyn-messenger:1.0.0
    ports:
      - "4777:4777"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/lumyn
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - mongo
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4777/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:5.0
    volumes:
      - mongo-data:/data/db
      - ./backups:/backups
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    restart: always
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./static:/usr/share/nginx/html:ro
    depends_on:
      - app
    restart: always

volumes:
  mongo-data:
```

---

## Server Deployment

### Linux Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Start services
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl start nginx
sudo systemctl enable nginx
```

### PM2 Process Management

```bash
# Install PM2
npm install -g pm2

# Create ecosystem config
pm2 ecosystem

# Start with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Save process list
pm2 save

# Set startup on reboot
pm2 startup
pm2 save
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'lumyn-app',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4777,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Nginx Configuration

```nginx
upstream lumyn_app {
    server localhost:4777;
    keepalive 64;
}

server {
    listen 80;
    server_name lumyn.app www.lumyn.app;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lumyn.app www.lumyn.app;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/lumyn.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lumyn.app/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval';" always;

    # Proxy settings
    location / {
        proxy_pass http://lumyn_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://lumyn_app/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json;
}
```

### SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d lumyn.app -d www.lumyn.app

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal
sudo certbot renew --dry-run
```

---

## Cloud Platforms

### AWS Deployment

#### Using Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Initialize application
eb init -p "Node.js 18 running on 64bit Amazon Linux 2" lumyn-app

# Create environment
eb create lumyn-prod

# Deploy
eb deploy

# View logs
eb logs

# SSH into instance
eb ssh
```

#### Using EC2 with RDS

```bash
# AMI: Ubuntu 22.04 LTS
# Instance type: t3.medium (minimum)

# Security Group: Allow ports 80, 443, 22
# Key pair: Save your .pem file securely

# Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# Follow Linux Server Setup above
```

### DigitalOcean Deployment

```bash
# Create droplet (Ubuntu 22.04)
# Size: $12/month (2GB RAM, 2 vCPU)

# SSH into droplet
ssh root@your-droplet-ip

# Follow Linux Server Setup

# Use App Platform for easier deployment
# Push code to GitHub
# Deploy from DigitalOcean App Platform
```

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create lumyn-app

# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-atlas-uri

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Railway.app Deployment

```bash
# Connect GitHub repository
# Add environment variables in Railway dashboard
# Deploy automatically on push

# Environment variables needed:
# - NODE_ENV=production
# - JWT_SECRET
# - MONGODB_URI
# - SESSION_SECRET
```

---

## Monitoring & Maintenance

### Application Monitoring

#### Health Checks

```bash
# Check API health
curl https://lumyn.app/health

# Check database connection
curl https://lumyn.app/api/health/db

# Check Socket.IO
curl -N https://lumyn.app/socket.io/?transport=websocket
```

#### Error Tracking

```bash
# Install Sentry for error tracking
npm install @sentry/node

# Initialize in app
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Performance Monitoring

```bash
# Use New Relic or DataDog
npm install newrelic

# Enable APM in production
require('newrelic');
```

### Database Maintenance

#### MongoDB Backup

```bash
# Manual backup
mongodump --out ./backup-$(date +%Y%m%d)

# Automated daily backup (crontab)
0 2 * * * mongodump --out /backups/backup-$(date +\%Y\%m\%d) >> /var/log/mongo-backup.log 2>&1

# Restore from backup
mongorestore ./backup-20240115
```

#### Database Optimization

```javascript
// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.chats.createIndex({ participants: 1 });
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Check index usage
db.users.aggregate([{ $indexStats: {} }]);
```

### Log Management

```bash
# Using ELK Stack (Elasticsearch, Logstash, Kibana)
# or
# Using Azure Monitor, CloudWatch, or Stackdriver

# Application logs directory
/var/log/lumyn/
├── app.log
├── error.log
└── access.log

# Log rotation with logrotate
# /etc/logrotate.d/lumyn
/var/log/lumyn/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Performance Optimization

#### Caching Strategy

```typescript
// Redis caching
import redis from 'redis';
const client = redis.createClient();

// Cache user data
const getCachedUser = async (userId) => {
  const cached = await client.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await User.findById(userId);
  await client.setEx(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
};
```

#### Database Query Optimization

```javascript
// Use .lean() for read-only queries
Message.find().lean().exec();

// Use .select() to limit fields
User.find().select('email username avatar');

// Use pagination
Message.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });
```

---

## Deployment Checklist

Before going live:

- [ ] SSL certificate installed and valid
- [ ] Database backups configured and tested
- [ ] Monitoring and alerts set up
- [ ] Log aggregation configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Secret keys rotated
- [ ] Health check endpoint working
- [ ] Database indexes optimized
- [ ] CDN configured (optional)
- [ ] CI/CD pipeline tested
- [ ] Load balancing configured (if needed)
- [ ] Security headers set
- [ ] API documentation updated
- [ ] Runbook documentation created

---

## Post-Deployment

### Monitoring

```bash
# Check application status
pm2 status

# Monitor resource usage
pm2 monit

# View error logs
tail -f /var/log/lumyn/error.log

# Check MongoDB
mongo admin --eval "db.stats()"
```

### Troubleshooting

```bash
# Check if app is running
curl -I http://localhost:4777

# Check logs
pm2 logs lumyn-app

# Restart app if needed
pm2 restart lumyn-app

# Check disk space
df -h

# Check memory
free -h
```

---

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
git checkout previous-tag
npm install
npm run build
pm2 restart lumyn-app

# Or use database backup
mongorestore previous-backup/
```

---

For more information:
- [INSTALL.md](INSTALL.md) - Installation guide
- [CONFIG.md](CONFIG.md) - Configuration guide
- [README.md](README.md) - Project overview
