import User from '../models/User.js';
import Course from '../models/Course.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';

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

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { name, code, description, teacher, credits, grade } = req.body;

    // Find teacher by name if provided
    let teacherId = null;
    if (teacher && teacher !== 'TBD' && teacher.trim() !== '') {
      const teacherUser = await User.findOne({ name: teacher, role: 'teacher' });
      if (teacherUser) {
        teacherId = teacherUser._id;
      }
    }

    const newCourse = await Course.create({
      name,
      code,
      teacherId,
      teacher: teacher || 'TBD',
      description,
      credits,
      grade
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

    // Find teacher by name if teacher field is being updated
    if (updates.teacher && updates.teacher !== 'TBD' && updates.teacher.trim() !== '') {
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
