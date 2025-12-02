// Imports
import User from '../models/User.js';
import Course from '../models/Course.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import Remark from '../models/Remark.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LibraryResource from '../models/LibraryResource.js';
import Timetable from '../models/Timetable.js';

// Library resource admin management
export const adminCreateLibraryResource = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { title, description, author, category, tags, grade = 'All', courseId, linkUrl } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const resource = new LibraryResource({
      title,
      description: description || '',
      author: author || '',
      category: category || 'General',
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [],
      grade: String(grade || 'All'),
      courseId: courseId || undefined,
      isExternal: !!linkUrl,
      linkUrl: linkUrl || '',
      createdBy: adminId,
      isActive: true
    });

    if (req.file) {
      resource.file = {
        path: `/uploads/library/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    await resource.save();
    res.status(201).json({ success: true, message: 'Resource created', resource });
  } catch (error) {
    console.error('Admin create library resource error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminListLibraryResources = async (req, res) => {
  try {
    const resources = await LibraryResource.find({}).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Admin list library resources error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===== Timetable Management (Admin) =====
export const adminListTimetables = async (req, res) => {
  try {
    const { grade, section, academicYear, semester, isActive } = req.query;
    const query = {};
    if (grade) query.grade = String(grade);
    if (section) query.section = String(section);
    if (academicYear) query.academicYear = String(academicYear);
    if (semester) query.semester = String(semester);
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';
    const items = await Timetable.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, timetables: items });
  } catch (error) {
    console.error('Admin list timetables error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminCreateOrUpdateTimetable = async (req, res) => {
  try {
    const { grade, section, academicYear = '2025-2026', semester = 'Fall', effectiveFrom, effectiveTo, isActive = true } = req.body;
    if (!grade) return res.status(400).json({ success: false, message: 'grade is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'file is required' });
    const sectionValue = section && section !== '' ? String(section) : 'All';

    // Upsert timetable with file
    const doc = await Timetable.findOneAndUpdate(
      { grade: String(grade), section: sectionValue, academicYear: String(academicYear), semester: String(semester) },
      {
        $set: {
          file: {
            path: `/uploads/timetables/${req.file.filename}`,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
          isActive: !!isActive
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, message: 'Timetable uploaded', timetable: doc });
  } catch (error) {
    console.error('Admin create/update timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminUpdateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { effectiveFrom, effectiveTo, isActive } = req.body;
    const updates = {};
    if (effectiveFrom) updates.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo) updates.effectiveTo = new Date(effectiveTo);
    if (typeof isActive !== 'undefined') updates.isActive = !!isActive;

    const doc = await Timetable.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, message: 'Timetable updated', timetable: doc });
  } catch (error) {
    console.error('Admin update timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminDeleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await Timetable.findByIdAndDelete(id);
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (error) {
    console.error('Admin delete timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminDeleteLibraryResource = async (req, res) => {
  try {
    const { id } = req.params;
    await LibraryResource.findByIdAndDelete(id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Admin delete library resource error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get admin dashboard data
export const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments({})
    ]);

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
    const [students, teachers, courses] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments({})
    ]);

    res.json({
      stats: {
        students,
        teachers,
        courses,
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
    const { role, q } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, dateOfBirth, grade, section } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const userData = {
      name,
      email,
      password, // TODO: hash in production
      role: (role || 'student').toLowerCase(),
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    // Add student-specific fields
    if (grade) userData.grade = grade;
    if (section) userData.section = section;

    const newUser = await User.create(userData);

    res.json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) updates.email = updates.email.toLowerCase();
    if (updates.role) updates.role = updates.role.toLowerCase();
    if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get leave requests (admin)
export const getLeaveRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    const requests = await LeaveRequest.find(filter)
      .populate('requesterId', 'name email role grade section')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaveRequests: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Decide a leave request (approve/reject)
export const decideLeaveRequest = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const lr = await LeaveRequest.findById(id);
    if (!lr) return res.status(404).json({ success: false, message: 'Leave request not found' });

    lr.status = action === 'approve' ? 'approved' : 'rejected';
    lr.reviewedBy = admin._id;
    lr.reviewedAt = new Date();
    lr.reviewRemarks = remarks || '';
    await lr.save();

    // Emit updates
    const io = req.app.get('io');
    if (io) {
      io.emit('leaveRequestUpdated', {
        id: lr._id,
        status: lr.status,
        reviewedBy: { id: String(admin._id), name: admin.name },
        reviewedAt: lr.reviewedAt,
        reviewRemarks: lr.reviewRemarks
      });
    }

    res.json({ success: true, message: `Leave ${lr.status}`, leaveRequest: lr });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code, description, teacher, teacherId: providedTeacherId, credits, grade, semester } = req.body;

    // Prefer explicit teacherId if provided, otherwise resolve by name
    let teacherId = providedTeacherId || null;
    if (!teacherId && teacher && teacher !== 'TBD' && teacher.trim() !== '') {
      const teacherUser = await User.findOne({ name: teacher, role: 'teacher' });
      if (teacherUser) teacherId = teacherUser._id;
    }

    const newCourse = await Course.create({
      name,
      code,
      teacherId,
      teacher: teacher || 'TBD',
      description,
      credits,
      grade,
      semester: semester || 'Annual'
    });

    res.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If teacherId provided explicitly, keep it. Otherwise, if teacher name provided, resolve to teacherId
    if (updates.teacherId) {
      // keep provided teacherId
    } else if (updates.teacher && updates.teacher !== 'TBD' && updates.teacher.trim() !== '') {
      const teacherUser = await User.findOne({ name: updates.teacher, role: 'teacher' });
      if (teacherUser) {
        updates.teacherId = teacherUser._id;
      }
    }

    const course = await Course.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

// ================= FEE MANAGEMENT =================

// Get all fees
export const getFees = async (req, res) => {
  try {
    const fees = await Fee.find({}).sort({ createdAt: -1 });
    res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create new fee
export const createFee = async (req, res) => {
  try {
    const { title, amount, description, dueDate, academicYear, semester, appliesTo, grades } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, amount, and due date are required' });
    }

    const newFee = await Fee.create({
      title,
      amount,
      description,
      dueDate: new Date(dueDate),
      academicYear,
      semester,
      appliesTo: appliesTo || 'all',
      grades: appliesTo === 'grade-specific' ? grades : []
    });

    res.json({ success: true, message: 'Fee created successfully', fee: newFee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update fee
export const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const updatedFee = await Fee.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedFee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    res.json({ success: true, message: 'Fee updated successfully', fee: updatedFee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete fee
export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if fee exists
    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Check if there are any completed payments for this fee
    const completedPayments = await Payment.countDocuments({ 
      feeId: id, 
      status: 'completed' 
    });

    if (completedPayments > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete fee. ${completedPayments} student(s) have already paid this fee.`,
        paymentsCount: completedPayments
      });
    }

    // Delete the fee
    await Fee.findByIdAndDelete(id);

    // Also delete any pending/failed payments for this fee
    await Payment.deleteMany({ feeId: id, status: { $in: ['pending', 'failed'] } });

    res.json({ 
      success: true, 
      message: 'Fee deleted successfully', 
      id 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ================= PAYMENT MANAGEMENT =================

// Get all payments with filters
export const getPayments = async (req, res) => {
  try {
    const { studentName, paymentMethod, status, startDate, endDate } = req.query;
    const query = {};

    // Filter by student name
    if (studentName && studentName.trim()) {
      query.$or = [
        { studentName: { $regex: studentName.trim(), $options: 'i' } },
        { studentEmail: { $regex: studentName.trim(), $options: 'i' } }
      ];
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email phone studentId')
      .populate('feeId', 'title amount')
      .sort({ paymentDate: -1 });

    // Calculate stats
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;

    res.json({
      success: true,
      payments,
      stats: {
        total: payments.length,
        completed: completedPayments,
        totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create payment (for testing or manual entry)
export const createPayment = async (req, res) => {
  try {
    const { studentId, feeId, amount, paymentMethod, transactionId, remarks } = req.body;

    if (!studentId || !feeId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, Fee ID, amount, and payment method are required' 
      });
    }

    // Get student and fee details
    const student = await User.findById(studentId);
    const fee = await Fee.findById(feeId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    const newPayment = await Payment.create({
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      feeId,
      feeTitle: fee.title,
      amount,
      paymentMethod,
      transactionId,
      remarks,
      status: 'completed'
    });

    res.json({ success: true, message: 'Payment recorded successfully', payment: newPayment });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentsByMethod = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        byMethod: paymentsByMethod
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Export payments to CSV
export const exportPayments = async (req, res) => {
  try {
    const { studentName, paymentMethod, status, startDate, endDate } = req.query;
    const query = {};

    if (studentName && studentName.trim()) {
      query.$or = [
        { studentName: { $regex: studentName.trim(), $options: 'i' } },
        { studentEmail: { $regex: studentName.trim(), $options: 'i' } }
      ];
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email phone studentId')
      .populate('feeId', 'title amount')
      .sort({ paymentDate: -1 });

    // Convert to CSV format
    const csvData = payments.map(p => ({
      receiptNumber: p.receiptNumber,
      date: new Date(p.paymentDate).toLocaleDateString(),
      studentName: p.studentName,
      studentEmail: p.studentEmail,
      studentId: p.studentId?.studentId || 'N/A',
      feeTitle: p.feeTitle,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId || 'N/A',
      status: p.status,
      remarks: p.remarks || ''
    }));

    res.json({
      success: true,
      data: csvData,
      count: csvData.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Send fee reminder emails
export const sendFeeReminders = async (req, res) => {
  try {
    const { feeId } = req.body;

    if (!feeId) {
      return res.status(400).json({ success: false, message: 'Fee ID is required' });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Get all students who haven't paid
    const allStudents = await User.find({ role: 'student', status: 'active' });
    const paidStudentIds = await Payment.find({ 
      feeId, 
      status: 'completed' 
    }).distinct('studentId');

    const unpaidStudents = allStudents.filter(
      s => !paidStudentIds.some(id => id.toString() === s._id.toString())
    );

    // TODO: Send actual emails here
    // For now, just return the list
    const reminders = unpaidStudents.map(s => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      feeTitle: fee.title,
      amount: fee.amount,
      dueDate: fee.dueDate
    }));

    res.json({
      success: true,
      message: `Reminders prepared for ${reminders.length} students`,
      reminders,
      count: reminders.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== CLASS MANAGEMENT APIs ====================

// Get class overview with statistics
export const getClassOverview = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' })
      .select('name email grade studentId createdAt');

    // Calculate grade-wise statistics
    const gradeStats = {};
    for (let i = 1; i <= 12; i++) {
      const gradeStudents = students.filter(s => s.grade === String(i));
      gradeStats[i] = {
        total: gradeStudents.length
      };
    }

    // Overall statistics
    const totalStudents = students.length;

    res.json({
      success: true,
      data: {
        totalStudents,
        gradeStats,
        recentEnrollments: students
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(s => ({
            id: s._id,
            name: s.name,
            studentId: s.studentId,
            grade: s.grade,
            enrolledDate: s.createdAt
          }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get detailed student analytics
export const getStudentAnalytics = async (req, res) => {
  try {
    const { grade, search, performanceLevel, attendanceRange } = req.query;
    
    // Build query
    let query = { role: 'student', status: 'active' };
    
    if (grade && grade !== 'all') {
      query.grade = grade;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('name email grade studentId phone dateOfBirth createdAt')
      .sort({ grade: 1, name: 1 });

    // Get payment, attendance, and grade data for each student
    const studentsWithAnalytics = await Promise.all(students.map(async (student) => {
      // Get payment statistics
      const payments = await Payment.find({ studentId: student._id });
      const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
      const pendingPayments = payments.filter(p => p.status === 'pending').length;

      // Calculate real attendance percentage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        date: { $gte: thirtyDaysAgo }
      });
      
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate real average score from grades
      const grades = await Grade.find({ studentId: student._id });
      const averageScore = grades.length > 0 
        ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
        : 0;

      // Determine performance level
      let performanceLevel = 'Good';
      if (averageScore >= 90) performanceLevel = 'Excellent';
      else if (averageScore >= 75) performanceLevel = 'Good';
      else if (averageScore >= 60) performanceLevel = 'Average';
      else performanceLevel = 'Needs Improvement';

      // Check if at-risk (attendance < 75)
      const isAtRisk = attendance < 75 || averageScore < 60;

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        grade: student.grade,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        enrolledDate: student.createdAt,
        attendance: attendance,
        averageScore: averageScore,
        performanceLevel: performanceLevel,
        totalPaid: totalPaid,
        pendingPayments: pendingPayments,
        isAtRisk: isAtRisk
      };
    }));

    // Apply filters
    let filtered = studentsWithAnalytics;

    if (performanceLevel && performanceLevel !== 'all') {
      filtered = filtered.filter(s => s.performanceLevel === performanceLevel);
    }

    if (attendanceRange) {
      const [min, max] = attendanceRange.split('-').map(Number);
      filtered = filtered.filter(s => s.attendance >= min && s.attendance <= max);
    }

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get at-risk students
export const getAtRiskStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' })
      .select('name email grade studentId')
      .sort({ grade: 1, name: 1 });

    const atRiskStudents = await Promise.all(students.map(async (student) => {
      // Calculate real attendance percentage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        date: { $gte: thirtyDaysAgo }
      });
      
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate real average score
      const grades = await Grade.find({ studentId: student._id });
      const averageScore = grades.length > 0 
        ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
        : 0;

      const isLowAttendance = attendance < 75;
      const isLowPerformance = averageScore < 60;
      const isAtRisk = isLowAttendance || isLowPerformance;

      if (!isAtRisk) return null;

      const reasons = [];
      if (isLowAttendance) reasons.push(`Low Attendance (${attendance}%)`);
      if (isLowPerformance) reasons.push(`Low Performance (${averageScore}%)`);

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        grade: student.grade,
        attendance: attendance,
        averageScore: averageScore,
        reasons: reasons,
        severity: isLowAttendance && isLowPerformance ? 'High' : 'Medium'
      };
    }));

    const filtered = atRiskStudents.filter(s => s !== null);

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get individual student details with comprehensive data
export const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: 'student' })
      .select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get payment history
    const payments = await Payment.find({ studentId: id })
      .populate('feeId', 'title amount dueDate semester')
      .sort({ createdAt: -1 });

    // Get fee obligations
    const allFees = await Fee.find({
      $or: [
        { appliesTo: 'all' },
        { appliesTo: 'grade-specific', grades: student.grade }
      ],
      status: 'active'
    });

    const feeDetails = allFees.map(fee => {
      const payment = payments.find(p => p.feeId?._id.toString() === fee._id.toString());
      return {
        feeId: fee._id,
        title: fee.title,
        amount: fee.amount,
        dueDate: fee.dueDate,
        semester: fee.semester,
        status: payment?.status || 'pending',
        paidAmount: payment?.amount || 0,
        paidDate: payment?.createdAt
      };
    });

    // Get real grades data
    const grades = await Grade.find({ studentId: id }).sort({ date: -1 });
    
    // Calculate average score
    const averageScore = grades.length > 0 
      ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
      : 0;

    // Calculate subject-wise performance and trends
    const subjectMap = new Map();
    grades.forEach(grade => {
      if (!subjectMap.has(grade.subject)) {
        subjectMap.set(grade.subject, []);
      }
      subjectMap.get(grade.subject).push({
        score: (grade.score / grade.maxScore) * 100,
        date: grade.date
      });
    });

    const subjects = Array.from(subjectMap.entries()).map(([name, scores]) => {
      const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
      
      // Determine trend: compare recent scores with older ones
      let trend = 'stable';
      if (scores.length >= 2) {
        const recentAvg = scores.slice(0, Math.ceil(scores.length / 2))
          .reduce((sum, s) => sum + s.score, 0) / Math.ceil(scores.length / 2);
        const olderAvg = scores.slice(Math.ceil(scores.length / 2))
          .reduce((sum, s) => sum + s.score, 0) / (scores.length - Math.ceil(scores.length / 2));
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }
      
      return { name, score: avgScore, trend };
    });

    // Get recent tests
    const recentTests = grades.slice(0, 5).map(g => ({
      name: g.title,
      score: g.score,
      date: g.date,
      total: g.maxScore
    }));

    // Get real attendance data
    const allAttendance = await Attendance.find({ studentId: id }).sort({ date: -1 });
    
    // Overall attendance
    const totalDays = allAttendance.length;
    const presentDays = allAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const overallAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // This month attendance
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const thisMonthRecords = allAttendance.filter(a => a.date >= thisMonthStart);
    const thisMonthPresent = thisMonthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const thisMonthAttendance = thisMonthRecords.length > 0 
      ? Math.round((thisMonthPresent / thisMonthRecords.length) * 100)
      : 0;

    // Last month attendance
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(0);
    
    const lastMonthRecords = allAttendance.filter(a => a.date >= lastMonthStart && a.date < thisMonthStart);
    const lastMonthPresent = lastMonthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const lastMonthAttendance = lastMonthRecords.length > 0
      ? Math.round((lastMonthPresent / lastMonthRecords.length) * 100)
      : 0;

    // Monthly attendance data for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      
      const monthRecords = allAttendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
      const monthPresent = monthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const monthPercentage = monthRecords.length > 0
        ? Math.round((monthPresent / monthRecords.length) * 100)
        : 0;
      
      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        percentage: monthPercentage
      });
    }

    // Get remarks
    const remarks = await Remark.find({ studentId: id })
      .populate('teacherId', 'name')
      .populate('adminId', 'name')
      .sort({ date: -1 })
      .limit(10);

    const performanceData = {
      attendance: overallAttendance,
      averageScore: averageScore,
      subjects: subjects,
      recentTests: recentTests
    };

    const attendanceData = {
      overall: overallAttendance,
      thisMonth: thisMonthAttendance,
      lastMonth: lastMonthAttendance,
      monthlyData: monthlyData
    };

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          grade: student.grade,
          phone: student.phone,
          dateOfBirth: student.dateOfBirth,
          enrolledDate: student.createdAt,
          status: student.status
        },
        performance: performanceData,
        attendance: attendanceData,
        fees: feeDetails,
        payments: payments.map(p => ({
          id: p._id,
          feeTitle: p.feeId?.title || 'N/A',
          amount: p.amount,
          status: p.status,
          method: p.method,
          transactionId: p.transactionId,
          date: p.createdAt
        })),
        remarks: remarks.map(r => ({
          id: r._id,
          type: r.type,
          content: r.content,
          date: r.date,
          isPositive: r.isPositive,
          by: r.teacherId?.name || r.adminId?.name || 'System'
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
