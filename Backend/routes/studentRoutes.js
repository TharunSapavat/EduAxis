import express from 'express';
import {
  getDashboard,
  getCourses,
  getGrades,
  getAttendance,
  getAssignments,
  getTimetable,
  getAnnouncements,
  getFees,
  makePayment,
  downloadReceipt
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/courses', getCourses);
router.get('/grades', getGrades);
router.get('/attendance', getAttendance);
router.get('/assignments', getAssignments);
router.get('/timetable', getTimetable);
router.get('/announcements', getAnnouncements);
router.get('/fees', getFees);
router.post('/payment', makePayment);
router.get('/receipt/:paymentId', downloadReceipt);

export default router;
