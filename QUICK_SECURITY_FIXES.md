# Quick Security Fixes - Implementation Guide

## 🚨 CRITICAL: Fix Teacher Controller Multi-Tenant Leak

### Problem
All teacher queries are missing `schoolId` filtering, allowing teachers to see data from other schools.

### Files to Fix
`Backend/controllers/teacherController.js`

### Changes Required

#### 1. Dashboard Function (Lines 15-55)
```javascript
// BEFORE (VULNERABLE)
const teacherCourses = await Course.find({ teacherId });
const totalStudents = await User.countDocuments({
  role: 'student',
  grade: { $in: uniqueGrades }
});

// AFTER (SECURE)
const teacherCourses = await Course.find({ 
  teacherId,
  schoolId: req.schoolId 
});
const totalStudents = await User.countDocuments({
  role: 'student',
  grade: { $in: uniqueGrades },
  schoolId: req.schoolId
});
```

#### 2. Get Courses Function (Lines 60-85)
```javascript
// BEFORE (VULNERABLE)
const courses = await Course.find({ teacherId }).sort({ grade: 1, name: 1 });
const studentCount = await User.countDocuments({
  role: 'student',
  grade: course.grade
});

// AFTER (SECURE)
const courses = await Course.find({ 
  teacherId,
  schoolId: req.schoolId 
}).sort({ grade: 1, name: 1 });

const studentCount = await User.countDocuments({
  role: 'student',
  grade: course.grade,
  schoolId: req.schoolId
});
```

#### 3. Get Students Function (Lines 90-125)
```javascript
// BEFORE (VULNERABLE)
let query = { role: 'student' };

// AFTER (SECURE)
let query = { 
  role: 'student',
  schoolId: req.schoolId 
};
```

#### 4. Mark Attendance Function (Lines 130-170)
```javascript
// BEFORE (VULNERABLE)
const attendance = new Attendance({
  studentId,
  courseId,
  status,
  date: date ? new Date(date) : new Date(),
  remarks
});

// AFTER (SECURE)
const attendance = new Attendance({
  schoolId: req.schoolId,  // ADD THIS
  studentId,
  courseId,
  status,
  date: date ? new Date(date) : new Date(),
  remarks
});
```

### Apply to ALL Functions
Search for these patterns and add `schoolId: req.schoolId`:
- `Course.find()`
- `User.find()` or `User.countDocuments()`
- `Assignment.find()`
- `Submission.find()`
- `Announcement.find()`
- `Schedule.find()`
- `StudyMaterial.find()`
- `Timetable.find()`

---

## 🔐 Enable Rate Limiting

### File: `Backend/server.js`

#### Step 1: Uncomment Imports (Line 18)
```javascript
// BEFORE
// import { apiLimiter, authLimiter } from './config/rateLimit.js';

// AFTER
import { apiLimiter, authLimiter } from './config/rateLimit.js';
```

#### Step 2: Apply Limiters (After line 85, before routes)
```javascript
// Add BEFORE route definitions
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);
```

### File: `Backend/routes/authRoutes.js`

```javascript
import express from 'express';
import { register, login, logout, getCurrentUser, changePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../config/rateLimit.js';  // ADD THIS

const router = express.Router();

router.post('/register', authLimiter, register);  // ADD authLimiter
router.post('/login', authLimiter, login);        // ADD authLimiter
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/change-password', authMiddleware, changePassword);

export default router;
```

---

## 🛡️ Re-Enable CSRF Protection

### File: `Backend/server.js`

#### Step 1: Uncomment CSRF Middleware (Line 33)
```javascript
// BEFORE
// import { doubleCsrfProtection, csrfTokenGenerator, csrfErrorHandler } from './middleware/csrf.js';

// AFTER
import { doubleCsrfProtection, csrfTokenGenerator, csrfErrorHandler } from './middleware/csrf.js';
```

#### Step 2: Add CSRF Endpoints (Around line 165)
```javascript
// CSRF token endpoint (must be BEFORE csrf protection)
app.get('/api/csrf-token', csrfTokenGenerator);

// Apply CSRF protection to state-changing routes
app.use('/api/student', doubleCsrfProtection);
app.use('/api/teacher', doubleCsrfProtection);
app.use('/api/admin', doubleCsrfProtection);
app.use('/api/superadmin', doubleCsrfProtection);

// CSRF error handler (must be AFTER routes, BEFORE general error handler)
app.use(csrfErrorHandler);
```

### File: `frontend/src/services/api.js`

#### Remove Disable Comment (Line 16)
```javascript
// BEFORE
// CSRF DISABLED - Causing too many issues with delete/send operations

// AFTER
// CSRF Protection Enabled
```

#### Add CSRF Token Interceptor (After line 12)
```javascript
// Request interceptor - Add CSRF token
api.interceptors.request.use(
  async (config) => {
    // GET requests don't need CSRF token
    if (config.method === 'get') {
      return config;
    }
    
    // Get CSRF token for state-changing requests
    try {
      const response = await axios.get('http://localhost:5000/api/csrf-token', {
        withCredentials: true
      });
      config.headers['x-csrf-token'] = response.data.token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

---

## 🔒 Strengthen Password Requirements

### File: `Backend/models/User.js`

#### Replace Password Field Definition (Lines 20-24)
```javascript
// BEFORE
password: {
  type: String,
  required: [true, 'Password is required'],
  minlength: [6, 'Password must be at least 6 characters long']
},

// AFTER
password: {
  type: String,
  required: [true, 'Password is required'],
  minlength: [10, 'Password must be at least 10 characters long'],
  validate: {
    validator: function(v) {
      // Require uppercase, lowercase, number, and special character
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(v);
    },
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  }
},
```

### File: `frontend/src/components/Register.jsx`

#### Update Password Input (Around line 220)
```javascript
<input
  type="password"
  required
  minLength={10}  // Changed from 6
  value={formData.password}
  onChange={handleInputChange}
  name="password"
  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
  placeholder="Minimum 10 characters"  // Update placeholder
/>
<p className="mt-1 text-xs text-slate-500">
  Must contain uppercase, lowercase, number, and special character (@$!%*?&)
</p>
```

---

## 🚫 Add Account Lockout

### File: `Backend/models/User.js`

#### Step 1: Add Fields (After line 72)
```javascript
loginAttempts: {
  type: Number,
  default: 0
},
lockUntil: {
  type: Date
},
```

#### Step 2: Add Virtual Property (After line 77)
```javascript
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});
```

#### Step 3: Add Method (After line 152)
```javascript
// Method to increment login attempts and lock account
userSchema.methods.incLoginAttempts = async function() {
  // If lock has expired, restart attempts at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment attempts
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes
  
  // Lock account if max attempts reached
  const needsLock = this.loginAttempts + 1 >= maxAttempts && !this.isLocked;
  if (needsLock) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};
```

### File: `Backend/controllers/authController.js`

#### Update Login Function (Around line 190)
```javascript
// Add BEFORE password comparison (after finding user)
// Check if account is locked
if (user.isLocked) {
  // Increment attempts even if locked to extend lock time
  await user.incLoginAttempts();
  const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
  return res.status(423).json({  // 423 Locked
    success: false,
    message: `Account is locked due to too many failed login attempts. Please try again in ${minutesLeft} minutes.`
  });
}

// Compare password using bcrypt
const isPasswordValid = await user.comparePassword(password);

if (!isPasswordValid) {
  // Increment failed attempts
  await user.incLoginAttempts();
  
  // Check if account is now locked
  const stillLocked = user.loginAttempts >= 5;
  if (stillLocked) {
    return res.status(423).json({
      success: false,
      message: 'Too many failed login attempts. Account locked for 15 minutes.'
    });
  }
  
  return res.status(401).json({ 
    success: false,
    message: `Invalid email or password. ${5 - user.loginAttempts} attempts remaining.`
  });
}

// Reset login attempts on successful login
if (user.loginAttempts > 0) {
  await user.resetLoginAttempts();
}
```

---

## ✅ Add Input Validation

### Step 1: Install Dependencies
```bash
cd Backend
npm install express-validator
```

### Step 2: Create Validation Middleware

#### File: `Backend/middleware/validation.js`
```javascript
import { body, param, query, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validations
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 10 })
    .withMessage('Password must be at least 10 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('role')
    .optional()
    .isIn(['student', 'teacher'])
    .withMessage('Public registration only for students and teachers'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Must be a valid phone number'),
  body('grade')
    .if(body('role').equals('student'))
    .isIn(['1','2','3','4','5','6','7','8','9','10','11','12'])
    .withMessage('Grade must be between 1-12'),
  validate
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('schoolCode')
    .optional()
    .isLength({ min: 3, max: 10 })
    .withMessage('School code must be 3-10 characters')
    .isAlphanumeric()
    .withMessage('School code must be alphanumeric')
    .toUpperCase(),
  validate
];

// Course validations
export const createCourseValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Course name must be at least 2 characters')
    .escape(),
  body('code')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Course code must be at least 3 characters')
    .isAlphanumeric()
    .withMessage('Course code must be alphanumeric')
    .toUpperCase(),
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1-6'),
  body('grade')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade must be between 1-12'),
  validate
];

// School validations (super admin)
export const createSchoolValidation = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('School name must be at least 3 characters')
    .escape(),
  body('code')
    .trim()
    .isLength({ min: 3 })
    .withMessage('School code must be at least 3 characters')
    .isAlphanumeric()
    .withMessage('School code must be alphanumeric')
    .toUpperCase(),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('phone')
    .isMobilePhone()
    .withMessage('Must be a valid phone number'),
  body('adminUser.name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Admin name must be at least 2 characters'),
  body('adminUser.email')
    .isEmail()
    .withMessage('Admin email must be valid')
    .normalizeEmail(),
  body('adminUser.password')
    .isLength({ min: 10 })
    .withMessage('Admin password must be at least 10 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Admin password must contain uppercase, lowercase, number, and special character'),
  validate
];

// ID validation
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  validate
];
```

### Step 3: Apply Validation to Routes

#### File: `Backend/routes/authRoutes.js`
```javascript
import express from 'express';
import { register, login, logout, getCurrentUser, changePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';  // ADD

const router = express.Router();

router.post('/register', registerValidation, register);  // ADD validation
router.post('/login', loginValidation, login);           // ADD validation
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/change-password', authMiddleware, changePassword);

export default router;
```

#### File: `Backend/routes/adminRoutes.js`
```javascript
import { createCourseValidation, mongoIdValidation } from '../middleware/validation.js';

// Apply to relevant routes
router.post('/courses', createCourseValidation, createCourse);
router.put('/courses/:id', mongoIdValidation, createCourseValidation, updateCourse);
router.delete('/courses/:id', mongoIdValidation, deleteCourse);
```

#### File: `Backend/routes/superAdminRoutes.js`
```javascript
import { createSchoolValidation, mongoIdValidation } from '../middleware/validation.js';

router.post('/schools', createSchoolValidation, createSchool);
router.put('/schools/:id', mongoIdValidation, updateSchool);
```

---

## 📝 Testing Your Fixes

### 1. Test Multi-Tenant Isolation
```bash
# Create 2 schools with different teachers
# Login as teacher from School A
# Try to access students from School B
# Should return empty or 403 error
```

### 2. Test Rate Limiting
```bash
# Try to login with wrong password 6 times
# 6th attempt should be blocked with 429 error
```

### 3. Test Account Lockout
```bash
# Login with wrong password 5 times
# Account should be locked for 15 minutes
# Try again after 15 minutes - should work
```

### 4. Test Password Strength
```bash
# Try to register with password: "test123"
# Should fail validation
# Try with: "Test@123456"
# Should succeed
```

### 5. Test Input Validation
```bash
# Try to create course with 1-character name
# Should fail with validation error
# Try SQL injection in email: "admin@test.com'; DROP TABLE users--"
# Should be sanitized/rejected
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All critical fixes applied
- [ ] Rate limiting enabled and tested
- [ ] CSRF protection enabled and tested
- [ ] Password requirements strengthened
- [ ] Account lockout working
- [ ] Input validation on all routes
- [ ] Environment variables set with strong secrets
- [ ] MongoDB indexes created
- [ ] SSL certificate installed
- [ ] Monitoring/logging configured
- [ ] Backup strategy implemented
- [ ] Load testing completed

---

## 📞 Need Help?

If you encounter issues implementing these fixes:

1. Check the error logs in `Backend/logs/`
2. Test each fix individually
3. Review the security audit report for context
4. Consult the improvement roadmap for long-term plans

**Remember:** Security is an ongoing process, not a one-time fix!
