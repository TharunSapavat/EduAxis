import express from 'express';
import {
  getSuperAdminDashboard,
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  updateSchoolStatus,
  updateSchoolSubscription,
  getPlatformStatistics
} from '../controllers/superAdminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and super admin role middleware to all routes
router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

// Dashboard and statistics
router.get('/dashboard', getSuperAdminDashboard);
router.get('/statistics', getPlatformStatistics);

// School management
router.route('/schools')
  .get(getAllSchools)
  .post(createSchool);

router.route('/schools/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

// School status and subscription management
router.patch('/schools/:id/status', updateSchoolStatus);
router.patch('/schools/:id/subscription', updateSchoolSubscription);

export default router;
