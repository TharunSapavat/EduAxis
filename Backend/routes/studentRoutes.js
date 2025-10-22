import express from 'express';
import {
  getDashboard,
  getCourses,
  getGrades,
  getAttendance,
  getAssignments,
  getTimetable,
  getAnnouncements,
  getFees
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

export default router;
