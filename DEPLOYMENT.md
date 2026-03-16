# Deployment Guide - ServeX

Guide for deploying ServeX to production environments.

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Database seeded with production data
- [ ] Environment variables configured
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup strategy in place

## Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_very_secure_random_string_here
NODE_ENV=production
```

### Frontend
Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Backend Deployment

1. **Install Node.js on server**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone repository**
```bash
git clone <your-repo-url>
cd service-booking-platform
```

3. **Install dependencies**
```bash
cd server
npm install --production
```

4. **Set up environment**
```bash
nano .env
# Add production values
```

5. **Initialize database**
```bash
node seed.js
```

6. **Install PM2 for process management**
```bash
sudo npm install -g pm2
pm2 start server.js --name servex-api
pm2 save
pm2 startup
```

7. **Set up Nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### Frontend Deployment

1. **Build frontend**
```bash
cd ..  # Back to root
npm install
npm run build
```

2. **Deploy to Nginx**
```bash
sudo cp -r dist/* /var/www/servex/
```

3. **Nginx config for frontend**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/servex;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. **Enable SSL**
```bash
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. Create account at railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables in Railway dashboard
5. Railway will auto-detect Node.js and deploy
6. Note your backend URL: `https://your-app.railway.app`

#### Frontend on Vercel

1. Create account at vercel.com
2. Click "New Project" → Import from GitHub
3. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL`: Your Railway backend URL
5. Deploy

### Option 3: Heroku

#### Backend

1. **Create Heroku app**
```bash
heroku create servex-api
```

2. **Add Procfile**
```
web: cd server && node server.js
```

3. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

5. **Initialize database**
```bash
heroku run node server/seed.js
```

#### Frontend

1. **Create separate Heroku app**
```bash
heroku create servex-frontend
```

2. **Add buildpack**
```bash
heroku buildpacks:set heroku/nodejs
```

3. **Add static.json**
```json
{
  "root": "dist",
  "routes": {
    "/**": "index.html"
  }
}
```

4. **Update package.json**
```json
{
  "scripts": {
    "start": "vite preview --port $PORT",
    "heroku-postbuild": "npm run build"
  }
}
```

5. **Deploy**
```bash
git push heroku main
```

### Option 4: Docker

#### Create Dockerfile for Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Create Dockerfile for Frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./server/database.sqlite:/app/database.sqlite

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

#### Deploy
```bash
docker-compose up -d
```

## Database Migration

### From SQLite to PostgreSQL (Production)

1. **Install PostgreSQL**
```bash
sudo apt install postgresql postgresql-contrib
```

2. **Create database**
```bash
sudo -u postgres psql
CREATE DATABASE servex_db;
CREATE USER servex_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE servex_db TO servex_user;
```

3. **Update database config**
```javascript
// server/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});
```

4. **Update schema for PostgreSQL**
```sql
-- Use SERIAL instead of AUTO_INCREMENT
-- Use VARCHAR instead of TEXT for specific fields
-- Adjust ENUM types
```

## Security Hardening

### Backend Security

1. **Add rate limiting**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

2. **Add helmet for security headers**
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

3. **Add input validation**
```bash
npm install express-validator
```

4. **Enable HTTPS only**
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Frontend Security

1. **Add Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; img-src 'self' https://images.unsplash.com;">
```

2. **Sanitize user inputs**
```bash
npm install dompurify
```

## Monitoring & Logging

### Backend Logging
```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Error Tracking
- Sentry.io for error tracking
- LogRocket for session replay
- Google Analytics for usage tracking

## Performance Optimization

### Backend
- Enable gzip compression
- Add Redis for caching
- Optimize database queries
- Add database indexes

### Frontend
- Enable code splitting
- Optimize images (use WebP)
- Add service worker for PWA
- Enable lazy loading

## Backup Strategy

### Database Backup
```bash
# SQLite
cp server/database.sqlite backups/database-$(date +%Y%m%d).sqlite

# PostgreSQL
pg_dump servex_db > backups/servex_db-$(date +%Y%m%d).sql
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Post-Deployment

1. **Test all features**
   - User registration and login
   - Service browsing
   - Booking creation
   - Payment processing
   - Email notifications

2. **Monitor logs**
   - Check for errors
   - Monitor API response times
   - Track user activity

3. **Set up alerts**
   - Server down alerts
   - High error rate alerts
   - Database connection issues

4. **Update DNS**
   - Point domain to server IP
   - Configure SSL certificates
   - Set up CDN if needed

## Rollback Plan

1. Keep previous version tagged in git
2. Maintain database backups
3. Document rollback procedure
4. Test rollback in staging

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Monitor disk space
- Check SSL certificate expiry
- Review error logs weekly
- Backup database daily

### Scaling Considerations
- Add load balancer for multiple instances
- Use CDN for static assets
- Implement caching strategy
- Consider microservices architecture
- Add database read replicas

## Support

For deployment issues:
- Check logs: `pm2 logs servex-api`
- Monitor resources: `pm2 monit`
- Restart service: `pm2 restart servex-api`
