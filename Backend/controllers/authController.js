import User from '../models/User.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, dateOfBirth } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
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

    // Create new user (pre-save hook will generate studentId/teacherId)
    const newUser = await User.create({
      name,
      email,
      password, // TODO: Hash this with bcrypt in production
      role: role || 'student',
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toJSON()
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

    // Find user by email
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

    // Compare password (TODO: Use bcrypt.compare in production)
    if (user.password !== password) {
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

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON()
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
  // In production, invalidate JWT token or clear session
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    // TODO: In production, get user ID from JWT token
    const userId = req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: user.toJSON() 
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
