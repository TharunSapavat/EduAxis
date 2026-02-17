# ⚡ URGENT: Critical Fixes Checklist
**Priority: IMMEDIATE ACTION REQUIRED**

---

## 🚨 CRITICAL FIX #1: Socket.IO Authentication (DO THIS FIRST!)

**File:** `Backend/server.js`  
**Lines:** 85-130  
**Time Estimate:** 30 minutes

### Step 1: Add JWT validation middleware for Socket.IO

Add this BEFORE `io.on('connection', ...)`:

```javascript
import jwt from 'jsonwebtoken';

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    // Extract token from auth or cookies
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.schoolId = decoded.schoolId;
    
    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(new Error('Invalid authentication token'));
  }
});
```

### Step 2: Update the 'join' handler

Replace the current `join` handler with:

```javascript
socket.on('join', (payload) => {
  try {
    const requestedUserId = payload?.userId;
    
    // Only allow joining own room
    if (requestedUserId && requestedUserId === socket.userId) {
      socket.join(`user:${requestedUserId}`);
      console.log(`User ${socket.userId} joined their room`);
    } else {
      socket.emit('error', { 
        message: 'Unauthorized: Cannot join another user\'s room' 
      });
      console.warn(`User ${socket.userId} attempted to join room ${requestedUserId}`);
    }
  } catch (err) {
    console.error('Socket join error:', err);
    socket.emit('error', { message: 'Failed to join room' });
  }
});
```

### Step 3: Update typing indicators

Replace `typing:start` handler:

```javascript
socket.on('typing:start', (payload) => {
  try {
    const { recipientId, senderName } = payload || {};
    
    // Validate sender is authenticated user
    if (!recipientId || !socket.userId) return;
    
    // Send typing indicator with VERIFIED sender ID
    io.to(`user:${recipientId}`).emit('typing:start', { 
      senderId: socket.userId,  // Use verified ID from socket
      senderName: senderName || 'Someone'
    });
  } catch (err) {
    console.error('Socket typing:start error:', err);
  }
});
```

Replace `typing:stop` handler:

```javascript
socket.on('typing:stop', (payload) => {
  try {
    const { recipientId } = payload || {};
    
    // Validate sender is authenticated user
    if (!recipientId || !socket.userId) return;
    
    // Use verified sender ID
    io.to(`user:${recipientId}`).emit('typing:stop', { 
      senderId: socket.userId 
    });
  } catch (err) {
    console.error('Socket typing:stop error:', err);
  }
});
```

### Step 4: Update frontend Socket.IO connection

**File:** `frontend/src/context/SocketContext.jsx`

Update socket initialization to send auth token:

```javascript
import Cookies from 'js-cookie'; // npm install js-cookie

useEffect(() => {
  if (user?._id) {
    const token = Cookies.get('token'); // Get JWT from cookie
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token  // Send token for authentication
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join', { userId: user._id });
    });

    // ... rest of socket setup
  }
}, [user]);
```

### Step 5: Test the fix

```bash
# Start backend
cd Backend
npm start

# Start frontend
cd frontend
npm run dev

# Test:
# 1. Login as user A
# 2. Open browser dev console
# 3. Try: socket.emit('join', { userId: 'another-user-id' })
# 4. Should get error: "Unauthorized: Cannot join another user's room"
```

**✅ SUCCESS CRITERIA:**
- Users can only join their own rooms
- Typing indicators use verified sender IDs
- Unauthorized join attempts are logged and rejected

---

## 🔴 CRITICAL FIX #2: Create .env File

**File:** `Backend/.env` (CREATE THIS FILE)  
**Time Estimate:** 5 minutes

### Step 1: Create `.env` file in Backend folder

```bash
cd Backend
touch .env  # Linux/Mac
# or
type nul > .env  # Windows
```

### Step 2: Copy this template

```env
# Database
MONGODB_URI=mongodb://localhost:27017/eduaxis

# JWT Secret (CHANGE THIS TO RANDOM STRING!)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-TO-RANDOM-STRING

# CSRF Secret (CHANGE THIS TO RANDOM STRING!)
CSRF_SECRET=your-csrf-secret-CHANGE-THIS-TO-RANDOM-STRING

# Server
PORT=5000
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional: For production
# NODE_ENV=production
# CORS_ORIGINS=https://yourdomain.com
```

### Step 3: Generate secure secrets

Use Node.js to generate random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice and use the outputs for `JWT_SECRET` and `CSRF_SECRET`.

### Step 4: Update .gitignore

Ensure `.env` is in `.gitignore`:

```bash
echo ".env" >> .gitignore
```

**✅ SUCCESS CRITERIA:**
- `.env` file exists and is not committed to git
- All environment variables are set with strong random secrets
- Application starts without errors

---

## 🔴 HIGH PRIORITY FIX #3: Enable Rate Limiting

**File:** `Backend/server.js`  
**Line:** Find where rate limiter is commented out  
**Time Estimate:** 2 minutes

### Enable the rate limiter

Uncomment or add:

```javascript
import { apiLimiter, authLimiter } from './config/rateLimit.js';

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Stricter rate limiting for auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

**✅ SUCCESS CRITERIA:**
- Too many requests return 429 status
- Login brute-force attacks are throttled

---

## 🔴 HIGH PRIORITY FIX #4: Enable CSRF Protection

**File:** `Backend/server.js`  
**Time Estimate:** 5 minutes

### Step 1: Import CSRF middleware

```javascript
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf.js';
```

### Step 2: Add token generation endpoint

```javascript
// Before route registration
app.get('/api/csrf-token', generateCsrfToken);
```

### Step 3: Apply CSRF to mutation routes

```javascript
// Apply CSRF to all POST, PUT, DELETE routes (except login/register)
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Exempt auth routes (they use different protection)
  if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) {
    return next();
  }
  
  return verifyCsrfToken(req, res, next);
});
```

### Step 4: Update frontend to fetch and send CSRF token

**File:** `frontend/src/services/api.js`

```javascript
// Fetch CSRF token on app load
let csrfToken = null;

export const initCsrf = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
};

// Add CSRF token to requests
api.interceptors.request.use(
  (config) => {
    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**File:** `frontend/src/main.jsx`

```javascript
import { initCsrf } from './services/api';

// Initialize CSRF on app load
initCsrf().then(() => {
  // ... render app
});
```

**✅ SUCCESS CRITERIA:**
- CSRF token is generated and validated
- Requests without valid token are rejected
- Cross-site request forgery attacks are prevented

---

## 🟡 MEDIUM FIX #5: Fix Phantom Grade Submissions

**File:** `Backend/controllers/teacherController.js`  
**Lines:** 251-310 (submitGrades function)  
**Time Estimate:** 2 minutes

### Replace the submission creation logic

Find this code (around line 291):

```javascript
let submission = await Submission.findOne({ assignmentId, studentId, schoolId });
if (!submission) {
  submission = new Submission({
    schoolId,
    assignmentId,
    studentId,
    status: 'submitted',
    submittedAt: new Date()
  });
}
```

Replace with:

```javascript
let submission = await Submission.findOne({ assignmentId, studentId, schoolId });
if (!submission) {
  return res.status(400).json({ 
    success: false, 
    message: 'Cannot grade assignment - student has not submitted it yet'
  });
}
```

**✅ SUCCESS CRITERIA:**
- Teachers cannot grade unsubmitted assignments
- Error message returned when attempting to grade non-existent submission
- Data integrity maintained

---

## 🟡 MEDIUM FIX #6: Fee Amount Validation

**File:** `Backend/controllers/adminController.js`  
**Function:** `createFee` (around line 524)  
**Time Estimate:** 2 minutes

### Add amount validation

After the existing validation (line ~529):

```javascript
if (!title || !amount || !dueDate) {
  return res.status(400).json({ 
    success: false, 
    message: 'Title, amount, and due date are required' 
  });
}

// ADD THIS:
if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Amount must be a valid positive number' 
  });
}
```

**✅ SUCCESS CRITERIA:**
- Negative fee amounts rejected
- Non-numeric amounts rejected
- Infinity/NaN values rejected

---

## 📋 TESTING CHECKLIST

After implementing all fixes, test:

- [ ] Socket.IO authentication works
- [ ] Users can only join their own rooms
- [ ] Rate limiting triggers after excessive requests
- [ ] CSRF protection rejects tampered requests
- [ ] Cannot grade unsubmitted assignments
- [ ] Cannot create negative fee amounts
- [ ] Application starts without errors
- [ ] .env file is properly configured
- [ ] All routes still work correctly
- [ ] No console errors in browser

---

## 🎯 ESTIMATED TOTAL TIME

| Fix | Time | Priority |
|-----|------|---------|
| Socket.IO Auth | 30 min | 🚨 CRITICAL |
| Create .env | 5 min | 🚨 CRITICAL |
| Enable Rate Limit | 2 min | 🔴 HIGH |
| Enable CSRF | 5 min | 🔴 HIGH |
| Fix Phantom Grades | 2 min | 🟡 MEDIUM |
| Fee Validation | 2 min | 🟡 MEDIUM |
| **TOTAL** | **~45 min** | |

---

## 📞 NEED HELP?

If you encounter issues:

1. Check logs: `Backend/logs/`
2. Review error messages carefully
3. Test one fix at a time
4. Refer to `BUG_REPORT.md` for detailed explanations
5. Check `SECURITY_AUDIT.md` for security context

**Remember:** Don't deploy to production until ALL critical fixes are implemented and tested!
