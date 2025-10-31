# Setup Guide for Re:Write

This guide will walk you through setting up the Re:Write application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Verify Prerequisites

```bash
# Check Node.js version (should be v16+)
node --version

# Check npm version
npm --version

# Check if MongoDB is installed
mongod --version
```

### 2. MongoDB Setup

**Option A: Local MongoDB Community Server**

```bash
# Start MongoDB service
# On Linux/WSL:
sudo systemctl start mongod
sudo systemctl enable mongod  # Auto-start on boot (optional)

# On macOS (with Homebrew):
brew services start mongodb-community

# On Windows:
# MongoDB should start automatically as a service
```

**Verify it's running:**
```bash
sudo systemctl status mongod  # Linux/WSL
# or
brew services list | grep mongodb  # macOS
```

**Option B: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace `MONGODB_URI` in backend/.env with your Atlas connection string

### 3. Install Dependencies

All dependencies are already installed! If you need to reinstall:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Environment Configuration

Environment files have been created with development defaults:

**Backend (.env):**
- PORT: 5000
- MongoDB: localhost:27017/revision-history
- JWT secrets: Development keys (change in production!)
- CORS: localhost:3000

**Frontend (.env):**
- API URL: http://localhost:5000/api/v1

**For Production:** Generate secure random strings for JWT secrets:
```bash
# Generate a secure random string (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the Application

You'll need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Your browser should automatically open to `http://localhost:3000`

### 6. First Time Use

1. **Register** a new account at `/register`
2. **Login** with your credentials
3. **Create** your first story
4. **Add** chapters to your story
5. **Start writing** with the rich text editor!

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB service is running: `sudo systemctl status mongod`
- Start MongoDB if needed: `sudo systemctl start mongod`
- Check connection string in `backend/.env`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change the port in backend/.env
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors in browser console

**Solution:**
- Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Restart backend server after changing .env

### Frontend Can't Connect to Backend

**Solution:**
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in `frontend/.env`
- Restart frontend after changing .env

### NPM Install Errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Quick Start Script (Optional)

You can create a script to start both servers:

**Linux/macOS:**
```bash
#!/bin/bash
# Create file: start.sh

# Start backend in background
cd backend && npm run dev &

# Start frontend
cd ../frontend && npm start
```

Make executable: `chmod +x start.sh`
Run: `./start.sh`

**Note:** You'll need to manually stop the backend process when done.

## Testing the Application

### Test Authentication
1. Go to `http://localhost:3000/register`
2. Create an account with a valid email and strong password
3. Login with your credentials

### Test Story Creation
1. Click "New Story"
2. Enter a title and description
3. Click "Create"

### Test Chapter Writing
1. Open your story
2. Click "New Chapter"
3. Enter a chapter title
4. Click "Edit" to open the editor
5. Start writing!

### Test Revisions
1. Write some content in the editor
2. Wait for auto-save (2 seconds)
3. Make changes to your content
4. Click "Save Revision" to create a manual save point
5. Click "View Revisions" to see all versions
6. Select two revisions and click "Compare Selected"
7. Try restoring an older revision

## Development Tips

### Backend Development

- API runs on `http://localhost:5000`
- Auto-reloads on file changes (nodemon)
- Check MongoDB with: `mongosh`
- View collections: `use revision-history` then `db.users.find()`, `db.stories.find()`

### Frontend Development

- App runs on `http://localhost:3000`
- Auto-reloads on file changes
- React DevTools recommended
- Check console for errors

### Database Management

View your data using MongoDB Shell (`mongosh`):
```bash
# Connect to MongoDB shell
mongosh

# Switch to revision-history database
use revision-history

# View all stories
db.stories.find()

# View all users
db.users.find()

# View all chapters
db.chapters.find()

# View all revisions
db.revisions.find()

# Count documents
db.stories.countDocuments()

# Exit shell
exit
```

📘 **For more advanced queries and examples**, see [MONGOSH_GUIDE.md](./MONGOSH_GUIDE.md)

## Next Steps

Once everything is running:

1. Explore the editor features (bold, italic, headings, lists)
2. Try the auto-save functionality
3. Create multiple chapters and navigate between them
4. Experiment with revision history
5. Test the comparison feature
6. Try restoring old revisions

## Production Deployment

See the main README.md for deployment instructions for:
- Railway/Render (Backend)
- Vercel/Netlify (Frontend)
- MongoDB Atlas (Database)

## Deployment: Netlify + AWS EC2

This app is a MERN stack with a React frontend and an Express backend. Below are two battle‑tested deployment paths:

- Option A (recommended): Frontend on Netlify (CDN) + Backend API on AWS EC2 + MongoDB Atlas
- Option B: Everything on a single EC2 (Nginx serves the SPA and proxies to Node)

### Requirements

- Domain(s): `yourdomain.com`, optionally `api.yourdomain.com`
- MongoDB Atlas connection string
- Strong JWT secrets (32+ characters)

### Option A: Frontend on Netlify, Backend on EC2

1) Backend on EC2

- Launch an Ubuntu EC2 instance (t2.micro+). Open security group ports: 22 (SSH), 80/443 (HTTP/HTTPS).
- SSH and install dependencies:
```bash
sudo apt update -y
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm i -g pm2
```
- Clone and set up the backend:
```bash
cd /opt && sudo git clone <YOUR_REPO_URL> RevisionHistory
cd RevisionHistory/backend
npm ci
```
- Create `backend/.env` with production values:
```
NODE_ENV=production
PORT=5000
MONGO_URI=<your MongoDB Atlas URI>
JWT_ACCESS_SECRET=<32+ char random>
JWT_REFRESH_SECRET=<32+ char random>
FRONTEND_URL=https://<your-frontend-domain>
```
- Start the API with PM2 and enable startup:
```bash
pm2 start server.js --name rewrite-api
pm2 save
pm2 startup
```

2) Nginx reverse proxy for the API (EC2)

Create a site config for `api.yourdomain.com`:
```bash
sudo tee /etc/nginx/sites-available/rewrite-api <<'EOF'
server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/rewrite-api /etc/nginx/sites-enabled/rewrite-api
sudo nginx -t && sudo systemctl reload nginx
```

Add TLS with Let’s Encrypt (recommended):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Your production API base URL will be `https://api.yourdomain.com/api/v1`.

3) Frontend on Netlify

- In Netlify → New site → Import from Git (or drag-and-drop build).
- Build settings:
  - Base directory: `frontend`
  - Build command: `npm ci && npm run build`
  - Publish directory: `frontend/build`
- Environment variables (Netlify → Site settings → Environment):
  - `REACT_APP_API_URL=https://api.yourdomain.com/api/v1`
- SPA routing: add `frontend/public/_redirects` with:
```text
/* /index.html 200
```
- Deploy. Copy your Netlify site domain (or connect a custom domain) and make sure `FRONTEND_URL` in `backend/.env` exactly matches that origin (scheme + domain). Then restart the API:
```bash
pm2 restart rewrite-api
```

Notes on CORS and cookies:
- The backend uses credentials for refresh tokens. Keep both frontend and backend on HTTPS. Ensure `FRONTEND_URL` matches your Netlify (or custom) domain exactly.

### Option B: All-in on EC2 (SPA + API)

1) Build and copy the frontend
```bash
cd /opt/RevisionHistory/frontend
npm ci
npm run build
sudo mkdir -p /var/www/rewrite
sudo cp -r build/* /var/www/rewrite/
```

2) Nginx site for SPA + API proxy
```bash
sudo tee /etc/nginx/sites-available/rewrite <<'EOF'
server {
  listen 80;
  server_name yourdomain.com;

  root /var/www/rewrite;
  index index.html;

  # API proxy
  location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # SPA routing
  location / {
    try_files $uri /index.html;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/rewrite /etc/nginx/sites-enabled/rewrite
sudo nginx -t && sudo systemctl reload nginx
```

3) Backend environment and process

Create `backend/.env`:
```
NODE_ENV=production
PORT=5000
MONGO_URI=<your MongoDB Atlas URI>
JWT_ACCESS_SECRET=<32+ char random>
JWT_REFRESH_SECRET=<32+ char random>
FRONTEND_URL=http://yourdomain.com
```

Start the API with PM2:
```bash
cd /opt/RevisionHistory/backend
npm ci
pm2 start server.js --name rewrite-api
pm2 save
pm2 startup
```

4) TLS (recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

If serving both from the same domain, set `REACT_APP_API_URL=https://yourdomain.com/api/v1` before building the frontend.

### Environment Variables Summary

- Backend (`backend/.env`):
  - `NODE_ENV=production`
  - `PORT=5000`
  - `MONGO_URI`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (strong random strings)
  - `FRONTEND_URL` (exact frontend origin)
- Frontend (Netlify env or `.env` before build):
  - `REACT_APP_API_URL=<api base>/api/v1`

### Common Pitfalls

- CORS errors: `FRONTEND_URL` mismatch; restart backend after changing `.env`.
- Cookies not sent: use HTTPS on both origins; Netlify domain must match `FRONTEND_URL`.
- SPA 404s: Netlify `_redirects` or Nginx `try_files` not configured.

## Getting Help

- Check the main README.md for more documentation
- Review error logs in terminal
- Check browser console for frontend errors
- Verify all environment variables are set correctly

## Security Notes

⚠️ **Important for Production:**

1. Change JWT secrets to strong random strings
2. Use MongoDB Atlas with authentication
3. Enable HTTPS
4. Set NODE_ENV=production
5. Use proper CORS configuration
6. Keep dependencies updated

---

**You're all set!** Start writing your first story. 🎉

