# Login Troubleshooting Guide

## ✅ Backend Status: WORKING
The API has been tested and is responding correctly.

## 🔐 Test Account
Use this account to test login functionality:
- **Email:** `demo@example.com`
- **Password:** `Demo1234`

## Password Requirements
When creating new accounts, passwords must:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number

**Examples:**
- ✅ `Demo1234` (valid)
- ✅ `MyPass123` (valid)
- ✅ `Testing1` (valid)
- ❌ `demo1234` (no uppercase)
- ❌ `DEMO1234` (no lowercase)
- ❌ `Demo` (too short, no number)
- ❌ `DemoPassword` (no number)

## Common Issues

### 1. "Invalid credentials" Error
**Cause:** Email or password is incorrect, or account doesn't exist.

**Solution:**
- Use the test account above
- Or register a new account first
- Make sure password meets requirements

### 2. Nothing happens when clicking Login
**Cause:** JavaScript error or network issue

**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Check Network tab for failed requests

### 3. CORS Error
**Symptom:** Console shows "blocked by CORS policy"

**Solution:**
1. Make sure backend is running: `cd backend && npm start`
2. Make sure frontend is running: `cd frontend && npm start`
3. Backend should be on http://localhost:5000
4. Frontend should be on http://localhost:3000

### 4. Can't register new account
**Cause:** Password doesn't meet requirements

**Solution:**
- Use a password with at least 8 characters
- Include uppercase, lowercase, and numbers
- Example: `MyPassword123`

## Testing Steps

### Test Login Flow
1. Open http://localhost:3000
2. You should be redirected to `/login`
3. Enter:
   - Email: `demo@example.com`
   - Password: `Demo1234`
4. Click "Login"
5. You should be redirected to `/stories`

### Test Registration Flow
1. Go to http://localhost:3000/register
2. Enter a new email
3. Enter a password meeting requirements (e.g., `TestUser123`)
4. Click "Register"
5. You should be redirected to `/stories`

### Verify Backend is Running
```bash
# Test registration endpoint
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Test login endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo1234"}'
```

## Still Having Issues?

### Check Browser Console
1. Press F12 or right-click → Inspect
2. Go to Console tab
3. Try logging in
4. Look for red error messages
5. Share these errors for further troubleshooting

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for the login request
5. Click on it to see:
   - Request URL
   - Status code
   - Response data

### Verify Servers are Running

**Backend (Terminal 1):**
```bash
cd /home/santhosh/projects/RevisionHistory/backend
npm start
```
Should show: "Server running on port 5000"

**Frontend (Terminal 2):**
```bash
cd /home/santhosh/projects/RevisionHistory/frontend
npm start
```
Should open browser to http://localhost:3000

## API Endpoints

- **Register:** `POST http://localhost:5000/api/v1/auth/register`
- **Login:** `POST http://localhost:5000/api/v1/auth/login`
- **Get Current User:** `GET http://localhost:5000/api/v1/auth/me`
- **Logout:** `POST http://localhost:5000/api/v1/auth/logout`

All working and tested! ✅

