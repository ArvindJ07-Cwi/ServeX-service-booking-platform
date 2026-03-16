# Troubleshooting Guide - ServeX

Common issues and their solutions.

## Installation Issues

### npm install fails

**Problem**: Dependencies fail to install
```
npm ERR! code ERESOLVE
```

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json

# Reinstall
npm install
cd server && npm install && cd ..
```

### Node version mismatch

**Problem**: "Unsupported engine" error

**Solution**:
```bash
# Check Node version
node --version

# Should be v18 or higher
# Install correct version using nvm
nvm install 18
nvm use 18
```

## Database Issues

### Database not found

**Problem**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**:
```bash
# Make sure you're in the server directory
cd server

# Run seed script
node seed.js

# Verify database exists
ls -la database.sqlite
```

### Database locked

**Problem**: `SQLITE_BUSY: database is locked`

**Solution**:
```bash
# Stop all running servers
# Delete database and recreate
cd server
rm database.sqlite
node seed.js
```

### Foreign key constraint failed

**Problem**: `FOREIGN KEY constraint failed`

**Solution**:
```bash
# Database might be corrupted
cd server
rm database.sqlite
node seed.js
cd ..
```

## Backend Issues

### Port 5000 already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution 1** - Kill process on port 5000:
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Solution 2** - Change port:
```bash
# Edit server/.env
PORT=5001
```

### JWT_SECRET not found

**Problem**: `JWT_SECRET is not defined`

**Solution**:
```bash
# Create server/.env file
cd server
cat > .env << EOF
PORT=5000
JWT_SECRET=supersecret123_change_this_in_production
NODE_ENV=development
EOF
```

### CORS errors

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```javascript
// Verify in server/server.js
app.use(cors());

// Or specify origin
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

## Frontend Issues

### Blank white screen

**Problem**: Frontend shows blank page

**Solution**:
```bash
# Check browser console for errors
# Common causes:

# 1. Backend not running
cd server && npm start

# 2. Wrong API URL
# Check src/services/api.js
# Should be: http://localhost:5000/api

# 3. Build cache issue
rm -rf node_modules/.vite
npm run dev
```

### Images not loading

**Problem**: Service images don't display

**Solution**:
```bash
# Check internet connection (images from Unsplash CDN)
# Check browser console for 404 errors

# If images are blocked:
# 1. Check browser extensions (ad blockers)
# 2. Check network tab in DevTools
# 3. Try different browser

# Verify image URLs in database:
cd server
sqlite3 database.sqlite
SELECT name, image FROM services LIMIT 3;
.quit
```

### Vite port conflict

**Problem**: Port 5173 already in use

**Solution**:
```bash
# Vite will automatically prompt for different port
# Or specify in vite.config.js:
server: {
  port: 3000
}
```

## Authentication Issues

### Can't login

**Problem**: Login fails with correct credentials

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:5000/api/health

# 2. Verify user exists
cd server
sqlite3 database.sqlite
SELECT email FROM users;
.quit

# 3. Clear localStorage
# In browser console:
localStorage.clear()
location.reload()

# 4. Check password
# Default password for seeded users: 123456
```

### Token expired

**Problem**: "Unauthorized" errors after some time

**Solution**:
```javascript
// Tokens don't expire in current implementation
// If you added expiry, clear localStorage:
localStorage.removeItem('token')
localStorage.removeItem('user')
// Then login again
```

### Protected routes not working

**Problem**: Redirected to login when logged in

**Solution**:
```bash
# Check localStorage has token
# In browser console:
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('user'))

# If null, login again
# If present but still failing, check token format
```

## Booking Issues

### Can't create booking

**Problem**: Booking creation fails

**Solution**:
```bash
# 1. Check you're logged in as user (not agent/admin)
# 2. Check cart has items
# 3. Check all required fields filled:
#    - Address
#    - Date (must be future date)
#    - Time

# 4. Check backend logs for errors
cd server
npm start
# Watch for error messages
```

### Booking status not updating

**Problem**: Status stuck on "pending"

**Solution**:
```bash
# 1. Login as agent
# 2. Go to Agent Dashboard
# 3. Accept the booking
# 4. Refresh user dashboard

# If still stuck, check database:
cd server
sqlite3 database.sqlite
SELECT id, status, agent_id FROM bookings;
.quit
```

### Can't cancel booking

**Problem**: Cancel button doesn't work

**Solution**:
```bash
# Can only cancel bookings with status:
# - pending
# - confirmed (if implemented)

# Cannot cancel:
# - accepted
# - in_progress
# - completed
# - cancelled

# Check booking status first
```

## Cart Issues

### Cart items disappear

**Problem**: Cart empties on refresh

**Solution**:
```javascript
// Cart uses localStorage
// Check if localStorage is enabled:
console.log(localStorage.getItem('cart'))

// If null, localStorage might be disabled
// Check browser settings

// Cart clears on logout (expected behavior)
```

### Can't add to cart

**Problem**: Add to cart doesn't work

**Solution**:
```bash
# 1. Check browser console for errors
# 2. Verify service has _id field
# 3. Check CartContext is working:

# In browser console:
console.log(JSON.parse(localStorage.getItem('cart')))
```

## API Issues

### 404 Not Found

**Problem**: API endpoints return 404

**Solution**:
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Verify endpoint exists
# Check server/routes/ files

# Common mistakes:
# - Wrong HTTP method (GET vs POST)
# - Missing /api prefix
# - Typo in endpoint name
```

### 401 Unauthorized

**Problem**: Protected endpoints return 401

**Solution**:
```bash
# 1. Check token exists
localStorage.getItem('token')

# 2. Check token format
# Should be: "Bearer <token>"

# 3. Check token is valid
# Login again to get fresh token

# 4. Check middleware
# Verify authMiddleware.js is working
```

### 500 Internal Server Error

**Problem**: Server crashes or returns 500

**Solution**:
```bash
# Check backend logs
cd server
npm start
# Watch for error stack traces

# Common causes:
# - Database query error
# - Missing required field
# - Type mismatch
# - Null reference

# Check server/controllers/ for bugs
```

## Performance Issues

### Slow page load

**Problem**: Pages take long to load

**Solution**:
```bash
# 1. Check network tab in DevTools
# 2. Look for slow API calls
# 3. Check image loading times

# Optimize:
# - Enable browser caching
# - Use production build
npm run build
npm run preview

# - Check database queries
# - Add indexes if needed
```

### High memory usage

**Problem**: Browser/server uses too much memory

**Solution**:
```bash
# Frontend:
# - Close unused tabs
# - Clear browser cache
# - Restart dev server

# Backend:
# - Restart server
pm2 restart servex-api

# - Check for memory leaks
# - Monitor with:
pm2 monit
```

## Development Issues

### Hot reload not working

**Problem**: Changes don't reflect automatically

**Solution**:
```bash
# 1. Restart Vite dev server
# Ctrl+C then npm run dev

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Hard refresh browser
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### ESLint errors

**Problem**: Linting errors prevent build

**Solution**:
```bash
# Fix automatically
npm run lint -- --fix

# Or disable temporarily
# Add to vite.config.js:
plugins: [
  react({
    // Disable ESLint
  })
]
```

## Deployment Issues

### Build fails

**Problem**: `npm run build` fails

**Solution**:
```bash
# 1. Check for TypeScript errors
# 2. Check for unused imports
# 3. Check for console.logs

# Fix and rebuild
npm run build

# If still fails, check build logs
```

### Production API not working

**Problem**: Frontend can't reach backend in production

**Solution**:
```bash
# 1. Check VITE_API_BASE_URL
# Should be production API URL

# 2. Check CORS settings
# Backend should allow production domain

# 3. Check SSL certificates
# Both frontend and backend should use HTTPS
```

## Getting Help

### Check Logs

**Backend logs**:
```bash
cd server
npm start
# Watch console output
```

**Frontend logs**:
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab

### Debug Mode

**Enable verbose logging**:
```javascript
// In src/services/api.js
api.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('Error:', error.response);
    return Promise.reject(error);
  }
);
```

### Database Inspection

```bash
cd server
sqlite3 database.sqlite

# Useful queries:
.tables                          # List tables
.schema users                    # Show table structure
SELECT * FROM users;             # View all users
SELECT * FROM services LIMIT 5;  # View services
SELECT * FROM bookings;          # View bookings

# Exit
.quit
```

### Reset Everything

**Nuclear option** - Start fresh:
```bash
# Delete everything
rm -rf node_modules
rm -rf server/node_modules
rm -rf server/database.sqlite
rm package-lock.json
rm server/package-lock.json

# Reinstall
npm install
cd server && npm install && node seed.js && cd ..

# Restart
cd server && npm start &
npm run dev
```

## Still Having Issues?

1. Check the [README.md](README.md) for setup instructions
2. Review [QUICKSTART.md](QUICKSTART.md) for basic setup
3. Check [TESTING.md](TESTING.md) for testing procedures
4. Search for error message in browser/console
5. Check GitHub issues (if repository is public)

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port in use | Kill process or change port |
| `SQLITE_CANTOPEN` | Database missing | Run `node seed.js` |
| `JWT_SECRET is not defined` | Missing .env | Create server/.env |
| `401 Unauthorized` | No/invalid token | Login again |
| `404 Not Found` | Wrong endpoint | Check API routes |
| `CORS error` | CORS not enabled | Check server CORS config |
| `Cannot read property of undefined` | Missing data | Check API response |
| `Network Error` | Backend not running | Start backend server |

## Prevention Tips

1. Always run `node seed.js` after database changes
2. Keep backend running while developing
3. Clear localStorage when switching users
4. Use correct test credentials
5. Check browser console regularly
6. Monitor backend logs
7. Keep dependencies updated
8. Backup database before major changes
