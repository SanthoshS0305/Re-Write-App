# Quick Start Guide

Get Revision History running in 3 minutes!

## Prerequisites

- Node.js (v16+)
- MongoDB Community Server installed and running

## 1. Start MongoDB Service

```bash
# Linux/WSL
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows - MongoDB service starts automatically
```

## 2. Start the Backend

Open a terminal:

```bash
cd backend
npm run dev
```

Wait until you see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

## 3. Start the Frontend

Open a NEW terminal (keep the backend running):

```bash
cd frontend
npm start
```

Your browser will automatically open to `http://localhost:3000`

## 4. Login or Create Account

### Option A: Use Test Account
```
Email:    demo@example.com
Password: Demo1234
```

### Option B: Create Your Own Account
1. Click "Register"
2. Enter your email and password
   - Min 8 characters
   - Must have uppercase, lowercase, and number
   - Example: `MyPass123`
3. You'll be automatically logged in

## 5. Start Writing!

1. Click "New Story"
2. Give it a title and description
3. Click "New Chapter"
4. Start writing in the editor!

## Features to Try

- ✨ **Auto-save** - Your work saves automatically every 2 seconds
- 📝 **Formatting** - Use the toolbar for:
  - 12 font families (Times New Roman, Georgia, Arial, Merriweather, etc.)
  - Font sizes from 10pt to 36pt
  - Line spacing (Single, 1.15, 1.5, Double)
  - Bold, Italic, Headings, Lists
- 📚 **Multiple chapters** - Organize your story into chapters
- ⏮️ **Revisions** - Click "Save Revision" to create save points
- 🔍 **Compare** - View differences between any two versions
- ↩️ **Restore** - Roll back to any previous version

## Troubleshooting

**Can't connect to MongoDB?**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start it if needed
sudo systemctl start mongod
```

**Port already in use?**
```bash
# Find what's using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

**Frontend won't start?**
- Make sure backend is running first
- Check that no other app is using port 3000

## Stopping the App

When you're done:
1. Press `Ctrl+C` in the Frontend terminal
2. Press `Ctrl+C` in the Backend terminal

MongoDB will keep running in the background. To stop it:
```bash
sudo systemctl stop mongod  # Linux/WSL
# or
brew services stop mongodb-community  # macOS
```

## That's It!

You're ready to write. Check out SETUP.md for detailed configuration options.

Happy writing! ✍️

