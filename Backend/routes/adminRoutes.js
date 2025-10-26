import express from 'express';
import {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCourses,
  createCourse,
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
  sendFeeReminders
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getCourses);
router.post('/courses', createCourse);
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

export default router;
