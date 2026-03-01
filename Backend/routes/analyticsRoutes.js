import express from 'express';
import {
  getStudentPerformance,
  updateStudentPerformance,
  getAtRiskStudents,
  getClassPerformanceReport,
  getPerformanceTrend
} from '../controllers/analyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get student performance
router.get('/student/:studentId/:courseId', getStudentPerformance);

// Update student performance (admin can trigger)
router.post('/update/:studentId/:courseId', roleMiddleware('admin'), updateStudentPerformance);

// Get at-risk students
router.get('/at-risk/:courseId', roleMiddleware('teacher', 'admin'), getAtRiskStudents);

// Get class performance report
router.get('/class-report/:courseId', roleMiddleware('teacher', 'admin'), getClassPerformanceReport);

// Get performance trend
router.get('/trend/:studentId/:courseId', getPerformanceTrend);

export default router;
