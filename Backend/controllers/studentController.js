import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';

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
