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
  getStats
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

export default router;
