import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Submission from '../models/Submission.js';
import Timetable from '../models/Timetable.js';

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

    // Get total courses matching student's grade (enrolled courses)
    const totalCourses = await Course.countDocuments({ 
      status: 'active',
      grade: Number(student.grade)
    });

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
    // Determine student from auth or query
    const studentId = req.query.studentId || req.user?._id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Filter courses by matching grade and active status
    const courses = await Course.find({ status: 'active', grade: Number(student.grade) })
      .populate('teacherId', 'name email');

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get student grades
export const getGrades = async (req, res) => {
  try {
    // Prefer explicit query param; fall back to auth user
    const studentId = req.query.studentId || req.user?._id;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Pull graded submissions for this student and join assignment/course where available
    const gradedSubmissions = await Submission.find({
      studentId,
      status: 'graded'
    })
      .populate({
        path: 'assignmentId',
        select: 'title totalMarks subject courseId',
        populate: { path: 'courseId', select: 'name code' }
      })
      .sort({ gradedAt: -1, updatedAt: -1 });

    const grades = gradedSubmissions.map((submission) => {
      const a = submission.assignmentId || {};
      const course = a.courseId || {};
      const subjectName = course.name || a.subject || 'N/A';
      const totalMarks = a.totalMarks || 100;
      return {
        subject: subjectName,
        assignment: a.title || 'Assignment',
        marks: submission.marks ?? 0,
        total: totalMarks,
        grade: calculateGrade(submission.marks ?? 0, totalMarks),
        date: submission.gradedAt || submission.updatedAt || submission.createdAt,
        courseCode: course.code || undefined,
        feedback: submission.feedback || undefined,
      };
    });

    res.json({ success: true, grades });
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
    const student = req.user; // User is already loaded by auth middleware
    const { day } = req.query; // Optional: Get timetable for specific day

    // Find active timetable for student's grade and section
    const timetableDoc = await Timetable.findOne({
      grade: student.grade,
      section: student.section,
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: new Date() } }
      ]
    })
    .populate('schedule.courseId', 'name code')
    .populate('schedule.teacherId', 'name email');

    if (!timetableDoc) {
      // Return sample timetable if no timetable found
      return res.json({ 
        success: true,
        timetable: {
          grade: student.grade,
          section: student.section,
          schedule: [
            { day: 'Monday', startTime: '09:00', endTime: '10:00', subject: 'Mathematics', room: 'A101', type: 'lecture' },
            { day: 'Monday', startTime: '10:00', endTime: '11:00', subject: 'Physics', room: 'B202', type: 'lecture' },
            { day: 'Tuesday', startTime: '10:00', endTime: '11:00', subject: 'Chemistry', room: 'C303', type: 'lab' },
            { day: 'Wednesday', startTime: '09:00', endTime: '10:00', subject: 'English', room: 'A105', type: 'lecture' }
          ],
          message: 'Sample timetable - actual timetable not yet configured'
        }
      });
    }

    // If specific day requested, filter schedule
    let schedule = timetableDoc.schedule;
    if (day) {
      schedule = timetableDoc.getDaySchedule(day);
    }

    // Get today's schedule
    const todaySchedule = timetableDoc.getTodaySchedule();

    res.json({ 
      success: true,
      timetable: {
        grade: timetableDoc.grade,
        section: timetableDoc.section,
        academicYear: timetableDoc.academicYear,
        semester: timetableDoc.semester,
        schedule: schedule,
        todaySchedule: todaySchedule,
        effectiveFrom: timetableDoc.effectiveFrom,
        effectiveTo: timetableDoc.effectiveTo
      }
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

// Get fees for student
export const getFees = async (req, res) => {
  try {
    const studentId = req.user._id; // Get from authenticated user
    const student = req.user; // Already loaded by middleware

    // Get fees that apply to this student's grade
    // Either fees for all students OR fees for this specific grade
    const activeFees = await Fee.find({ 
      status: 'active',
      $or: [
        { appliesTo: 'all' },
        { appliesTo: 'grade-specific', grades: student.grade }
      ]
    }).sort({ dueDate: 1 });

    // Get student's payment history
    const payments = await Payment.find({ studentId }).sort({ paymentDate: -1 });

    // Calculate totals
    const totalFeeAmount = activeFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = totalFeeAmount - totalPaid;

    // Calculate late fees
    const now = new Date();
    const lateFeesAmount = activeFees
      .filter(fee => new Date(fee.dueDate) < now)
      .reduce((sum, fee) => {
        const paidForThisFee = payments.find(p => p.feeId.toString() === fee._id.toString() && p.status === 'completed');
        if (!paidForThisFee) {
          const daysLate = Math.floor((now - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24));
          return sum + (daysLate * 10); // $10 per day late
        }
        return sum;
      }, 0);

    res.json({
      success: true,
      studentGrade: student.grade,
      studentSection: student.section,
      fees: activeFees,
      payments,
      summary: {
        totalFees: totalFeeAmount,
        totalPaid,
        pending,
        lateFees: lateFeesAmount,
        totalDue: pending + lateFeesAmount
      }
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Make payment
export const makePayment = async (req, res) => {
  try {
    const studentId = req.user._id; // Get from authenticated user
    const student = req.user; // User already loaded by middleware
    const { feeId, amount, paymentMethod, transactionId, remarks } = req.body;

    if (!studentId || !feeId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, Fee ID, amount, and payment method are required' 
      });
    }
    const fee = await Fee.findById(feeId);

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ 
      studentId, 
      feeId, 
      status: 'completed' 
    });

    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: 'This fee has already been paid' 
      });
    }

    // Calculate late fee if applicable
    const now = new Date();
    const dueDate = new Date(fee.dueDate);
    let lateFee = 0;
    
    if (now > dueDate) {
      const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 10; // $10 per day
    }

    const totalAmount = parseFloat(amount) + lateFee;

    const payment = await Payment.create({
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      feeId,
      feeTitle: fee.title,
      amount: totalAmount,
      paymentMethod,
      transactionId,
      status: 'completed',
      remarks: remarks || (lateFee > 0 ? `Includes late fee: ₹${lateFee}` : undefined)
    });

    // TODO: Send email notification

    res.json({
      success: true,
      message: 'Payment successful',
      payment,
      lateFee
    });
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Download receipt
export const downloadReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('studentId', 'name email phone studentId')
      .populate('feeId', 'title amount description');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Return payment data for frontend to generate PDF
    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        date: payment.paymentDate,
        student: {
          name: payment.studentName,
          email: payment.studentEmail,
          id: payment.studentId?.studentId
        },
        fee: {
          title: payment.feeTitle,
          amount: payment.feeId?.amount || payment.amount
        },
        payment: {
          amount: payment.amount,
          method: payment.paymentMethod,
          transactionId: payment.transactionId,
          status: payment.status
        },
        remarks: payment.remarks
      }
    });
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get course details
export const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('teacherId', 'name email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Get assignments for this course
    const assignments = await Assignment.find({ 
      courseId: id,
      status: 'active'
    }).sort({ dueDate: -1 }).limit(5);

    // Get announcements for this course
    const announcements = await Announcement.find({
      courseId: id,
      isActive: true
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        recentAssignments: assignments,
        recentAnnouncements: announcements
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Submit assignment
export const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { assignmentId, content, attachments } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment ID is required' 
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({ 
      assignmentId, 
      studentId 
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment already submitted. Contact your teacher to resubmit.' 
      });
    }

    // Check if submission is late
    const now = new Date();
    const isLate = now > assignment.dueDate;

    // Create submission
    const submission = await Submission.create({
      assignmentId,
      studentId,
      content,
      attachments: attachments || [],
      status: isLate ? 'late' : 'submitted',
      submittedAt: now
    });

    res.json({
      success: true,
      message: isLate 
        ? 'Assignment submitted late. Late submission noted.' 
        : 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get submission details for a specific assignment
export const getSubmissionDetails = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { assignmentId } = req.params;

    const submission = await Submission.findOne({ 
      assignmentId, 
      studentId 
    })
      .populate('assignmentId', 'title description dueDate totalMarks')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'No submission found for this assignment' 
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get library resources
export const getLibraryResources = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = req.user;

    // Get student's grade or default to '10'
    const studentGrade = student.grade || '10';

    // TODO: Create a proper LibraryResource model
    // For now, return sample data structure
    const resources = [
      {
        id: '1',
        title: 'Mathematics Textbook - Grade ' + studentGrade,
        type: 'Textbook',
        subject: 'Mathematics',
        format: 'PDF',
        availableOnline: true,
        downloadUrl: '/api/library/download/1',
        description: 'Official mathematics textbook for your grade'
      },
      {
        id: '2',
        title: 'Science Lab Manual',
        type: 'Lab Manual',
        subject: 'Science',
        format: 'PDF',
        availableOnline: true,
        downloadUrl: '/api/library/download/2',
        description: 'Comprehensive lab manual with experiments'
      },
      {
        id: '3',
        title: 'English Literature Collection',
        type: 'E-Book',
        subject: 'English',
        format: 'EPUB',
        availableOnline: true,
        downloadUrl: '/api/library/download/3',
        description: 'Collection of classic literature pieces'
      }
    ];

    // Borrowed books
    const borrowedBooks = [
      {
        id: 'b1',
        title: 'History of Ancient Civilizations',
        borrowedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    ];

    res.json({
      success: true,
      library: {
        availableResources: resources,
        borrowedBooks,
        borrowingLimit: 5,
        currentBorrowed: borrowedBooks.length
      }
    });
  } catch (error) {
    console.error('Get library resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};
