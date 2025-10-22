import { db } from '../models/database.js';

// Get teacher dashboard data
export const getDashboard = async (req, res) => {
  try {
    const teacherId = req.query.teacherId || '2';
    const teacherCourses = db.findCoursesByTeacher(teacherId);
    const totalStudents = teacherCourses.reduce((sum, course) => sum + course.students, 0);
    
    res.json({
      stats: {
        totalCourses: teacherCourses.length,
        totalStudents,
        pendingGrading: 23,
        classesToday: 4
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teacher courses
export const getCourses = async (req, res) => {
  try {
    const teacherId = req.query.teacherId || '2';
    const courses = db.findCoursesByTeacher(teacherId);
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get students list
export const getStudents = async (req, res) => {
  res.json({
    students: [
      { id: 1, name: 'John Doe', studentId: 'STU001', class: '10A', attendance: 95 },
      { id: 2, name: 'Jane Smith', studentId: 'STU002', class: '10A', attendance: 92 },
      { id: 3, name: 'Bob Johnson', studentId: 'STU003', class: '10B', attendance: 88 }
    ]
  });
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, date, remarks } = req.body;
    const teacherId = req.body.teacherId || '2';
    
    const attendance = db.markAttendance({
      studentId,
      courseId,
      status,
      date,
      markedBy: teacherId,
      remarks
    });
    
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Submit grades
export const submitGrades = async (req, res) => {
  const { studentId, subject, marks } = req.body;
  res.json({
    success: true,
    message: 'Grades submitted successfully',
    data: { studentId, subject, marks }
  });
};

// Get assignments
export const getAssignments = async (req, res) => {
  res.json({
    assignments: [
      { id: 1, title: 'Math Assignment 1', course: 'Mathematics 101', submissions: 40, total: 45 },
      { id: 2, title: 'Calculus Problem Set', course: 'Calculus', submissions: 28, total: 35 }
    ]
  });
};

// Post announcement
export const postAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, priority } = req.body;
    const teacherId = req.body.teacherId || '2';
    
    const announcement = db.addAnnouncement({
      title,
      content,
      createdBy: teacherId,
      createdByRole: 'teacher',
      targetAudience: targetAudience || 'all',
      priority: priority || 'normal'
    });
    
    res.json({
      success: true,
      message: 'Announcement posted successfully',
      data: announcement
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
