import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';

// Get student dashboard data
export const getDashboard = async (req, res) => {
  try {
    const studentId = req.query.studentId;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Find student
    const student = await User.findOne({ 
      $or: [{ _id: studentId }, { studentId: studentId }],
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Get pending assignments count
    const pendingAssignments = await Assignment.countDocuments({
      studentId: student._id,
      status: 'pending'
    });

    // Get total courses (TODO: implement student-course enrollment)
    const totalCourses = await Course.countDocuments({ status: 'active' });

    // Get attendance stats
    const attendanceRecords = await Attendance.find({ studentId: student._id });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const attendancePercentage = totalAttendance > 0 
      ? Math.round((presentCount / totalAttendance) * 100) 
      : 0;
    
    res.json({
      success: true,
      stats: {
        totalCourses,
        attendance: attendancePercentage,
        currentGrade: 'A-', // TODO: Calculate from grades
        pendingAssignments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student courses
export const getCourses = async (req, res) => {
  try {
    // TODO: Filter courses by student enrollment
    const courses = await Course.find({ status: 'active' }).populate('teacherId', 'name email');
    
    res.json({ 
      success: true,
      courses 
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student grades
export const getGrades = async (req, res) => {
  try {
    const studentId = req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Get graded assignments
    const gradedAssignments = await Assignment.find({
      studentId,
      status: 'graded'
    }).populate('courseId', 'name code');

    const grades = gradedAssignments.map(assignment => ({
      subject: assignment.courseId?.name || assignment.subject,
      marks: assignment.marks,
      total: assignment.totalMarks,
      grade: calculateGrade(assignment.marks, assignment.totalMarks),
      assignment: assignment.title,
      date: assignment.submittedAt
    }));

    res.json({ 
      success: true,
      grades 
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to calculate grade
function calculateGrade(marks, total) {
  const percentage = (marks / total) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  return 'F';
}

// Get student attendance
export const getAttendance = async (req, res) => {
  try {
    const studentId = req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    const attendanceRecords = await Attendance.find({ studentId })
      .populate('courseId', 'name code')
      .sort({ date: -1 });

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const excused = attendanceRecords.filter(a => a.status === 'excused').length;

    res.json({
      success: true,
      attendance: {
        overall: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        absent,
        late,
        excused,
        total,
        records: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student assignments
export const getAssignments = async (req, res) => {
  try {
    const studentId = req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    const assignments = await Assignment.find({ studentId })
      .populate('courseId', 'name code')
      .populate('teacherId', 'name')
      .sort({ dueDate: -1 });
    
    res.json({ 
      success: true,
      assignments 
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student timetable
export const getTimetable = async (req, res) => {
  try {
    // TODO: Implement timetable model and fetch student's schedule
    const timetable = [
      { day: 'Monday', time: '9:00 AM', subject: 'Mathematics', room: 'A101' },
      { day: 'Monday', time: '11:00 AM', subject: 'Physics', room: 'B202' },
      { day: 'Tuesday', time: '10:00 AM', subject: 'Chemistry', room: 'C303' },
      { day: 'Wednesday', time: '9:00 AM', subject: 'English', room: 'A105' }
    ];
    
    res.json({ 
      success: true,
      timetable 
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('createdBy', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(20);
    
    res.json({ 
      success: true,
      announcements 
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student fees
export const getFees = async (req, res) => {
  res.json({
    fees: {
      total: 50000,
      paid: 30000,
      pending: 20000,
      dueDate: '2025-11-30'
    }
  });
};
