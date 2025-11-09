import express from 'express';
import {
  getDashboard,
  getCourses,
  getCourseDetails,
  getGrades,
  getAttendance,
  getAssignments,
  submitAssignment,
  getSubmissionDetails,
  getTimetable,
  getAnnouncements,
  getFees,
  makePayment,
  downloadReceipt,
  getLibraryResources
} from '../controllers/studentController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protect all student routes - require authentication and student role
router.use(authMiddleware);
router.use(roleMiddleware('student'));

// Dashboard
router.get('/dashboard', getDashboard);

// Courses
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseDetails);

// Grades
router.get('/grades', getGrades);

// Attendance
router.get('/attendance', getAttendance);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments/submit', submitAssignment);
router.get('/assignments/:assignmentId/submission', getSubmissionDetails);

// Timetable
router.get('/timetable', getTimetable);

// Announcements
router.get('/announcements', getAnnouncements);

// Fees & Payments
router.get('/fees', getFees);
router.post('/payment', makePayment);
router.get('/receipt/:paymentId', downloadReceipt);

// Library
router.get('/library', getLibraryResources);

export default router;
