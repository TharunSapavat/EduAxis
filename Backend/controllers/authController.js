import User from '../models/User.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, dateOfBirth, grade, section, subject, gradesTeaching } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // If student, require grade; section is optional (admin can assign later)
    const effectiveRole = role || 'student';

    if (effectiveRole === 'student') {
      const validGrades = ['1','2','3','4','5','6','7','8','9','10','11','12'];
      if (!grade || !validGrades.includes(String(grade))) {
        return res.status(400).json({ success: false, message: 'Grade is required and must be between 1-12' });
      }
      const validSections = ['A','B','C','D'];
      if (section && !validSections.includes(String(section))) {
        return res.status(400).json({ success: false, message: 'Section must be A-D when provided' });
      }
    }

    // Prepare payload
    const payload = {
      name,
      email,
      password,
      role: effectiveRole,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    if (effectiveRole === 'student') {
      payload.grade = String(grade);
      if (section) payload.section = String(section);
    } else if (effectiveRole === 'teacher') {
      if (subject) payload.subject = subject;
      if (Array.isArray(gradesTeaching)) payload.gradesTeaching = gradesTeaching.map(String);
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = await User.create(payload);

    // Generate JWT token
    const token = newUser.generateAuthToken();

    // Set cookie with the token
    res.cookie('authToken', token, {
      httpOnly: true,      // Cookie cannot be accessed by JavaScript (secure)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'      // CSRF protection
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toJSON(),
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check role matches if provided
    if (role && user.role !== role) {
      return res.status(401).json({ 
        success: false,
        message: `Invalid credentials for ${role} role` 
      });
    }

    // Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Account is ${user.status}. Please contact administrator.` 
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Set cookie with the token
    res.cookie('authToken', token, {
      httpOnly: true,      // Cookie cannot be accessed by JavaScript (secure)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'      // CSRF protection
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    sameSite: 'lax'
  });
  
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
};

// Get current user (from JWT token)
export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached by auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
