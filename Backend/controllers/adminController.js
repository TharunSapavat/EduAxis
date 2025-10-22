import { db } from '../models/database.js';

// Get admin dashboard data
export const getDashboard = async (req, res) => {
  try {
    const totalStudents = db.users.filter(u => u.role === 'student').length;
    const totalTeachers = db.users.filter(u => u.role === 'teacher').length;
    const totalCourses = db.courses.length;
    
    res.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalClasses: 28,
        activeUsers: totalStudents + totalTeachers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get system stats
export const getStats = async (req, res) => {
  try {
    const students = db.users.filter(u => u.role === 'student').length;
    const teachers = db.users.filter(u => u.role === 'teacher').length;
    
    res.json({
      stats: {
        students,
        teachers,
        courses: db.courses.length,
        classes: 28,
        attendance: 94,
        revenue: 2500000
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = db.users.map(user => user.toJSON());
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, dateOfBirth } = req.body;
    
    const newUser = db.addUser({
      name,
      email,
      password,
      role,
      phone,
      dateOfBirth
    });
    
    res.json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedUser = db.updateUser(id, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    res.json({ courses: db.courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { name, code, teacherId, description, teacher, credits, semester } = req.body;
    
    const newCourse = db.addCourse({
      name,
      code,
      teacherId,
      teacher: teacher || 'TBD',
      description,
      credits,
      semester
    });
    
    res.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all classes
export const getClasses = async (req, res) => {
  res.json({
    classes: [
      { id: 1, name: 'Class 10-A', students: 45, teacher: 'Prof. Smith' },
      { id: 2, name: 'Class 10-B', students: 42, teacher: 'Prof. Johnson' },
      { id: 3, name: 'Class 11-A', students: 40, teacher: 'Dr. Williams' }
    ]
  });
};

// Get reports
export const getReports = async (req, res) => {
  res.json({
    reports: {
      attendance: { overall: 94, trend: 'up' },
      performance: { average: 85, trend: 'stable' },
      fees: { collected: 75, pending: 25 }
    }
  });
};
