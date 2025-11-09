import express from 'express';
import {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getClasses,
  getReports,
  getStats,
  getFees,
  createFee,
  updateFee,
  deleteFee,
  getPayments,
  createPayment,
  getPaymentStats,
  exportPayments,
  sendFeeReminders,
  getClassOverview,
  getStudentAnalytics,
  getAtRiskStudents,
  getStudentDetails,
  getLeaveRequests,
  decideLeaveRequest
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protect all admin routes - require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/dashboard', getDashboard);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/classes', getClasses);
router.get('/reports', getReports);

// Fee Management Routes
router.get('/fees', getFees);
router.post('/fees', createFee);
router.put('/fees/:id', updateFee);
router.delete('/fees/:id', deleteFee);

// Payment Management Routes
router.get('/payments', getPayments);
router.post('/payments', createPayment);
router.get('/payments/stats', getPaymentStats);
router.get('/payments/export', exportPayments);
router.post('/fees/reminders', sendFeeReminders);

// Class Management Routes
router.get('/class/overview', getClassOverview);
router.get('/class/students', getStudentAnalytics);
router.get('/class/at-risk', getAtRiskStudents);
router.get('/class/students/:id', getStudentDetails);

// Leave Request Management
router.get('/leave-requests', getLeaveRequests);
router.patch('/leave-requests/:id', decideLeaveRequest);

export default router;
