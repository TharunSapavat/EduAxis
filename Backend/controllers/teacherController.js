import { db } from '../models/database.js';
import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

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
  try {
    const teacherId = req.user?._id;
    const { assignmentId, studentId, marks, feedback } = req.body;

    if (!assignmentId || !studentId || typeof marks !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'assignmentId, studentId and numeric marks are required'
      });
    }

    // Validate teacher exists (optional; role middleware already ensures role)
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Load assignment to validate totalMarks and optional relationships
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Bounds check for marks
    const totalMarks = assignment.totalMarks || 100;
    if (marks < 0 || marks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${totalMarks}`
      });
    }

    // Find existing submission; if not present, create one so grades can be recorded
    let submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      submission = new Submission({
        assignmentId,
        studentId,
        status: 'submitted',
        submittedAt: new Date()
      });
    }

    submission.marks = marks;
    submission.feedback = feedback || submission.feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;
    await submission.save();

    res.json({
      success: true,
      message: 'Grade recorded successfully',
      submission
    });
  } catch (error) {
    console.error('Submit grades error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
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
