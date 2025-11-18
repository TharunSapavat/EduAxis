import express from 'express';
import {
  getDashboard,
  getCourses,
  getStudents,
  markAttendance,
  submitGrades,
  getAssignments,
  createAssignment,
  postAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getSubmissionsForAssignment
} from '../controllers/teacherController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { uploadAssignmentFiles, uploadLibraryFiles } from '../config/multer.js';

const router = express.Router();

// Protect all teacher routes - require authentication and teacher role
router.use(authMiddleware);
router.use(roleMiddleware('teacher'));

router.get('/dashboard', getDashboard);
router.get('/courses', getCourses);
router.get('/students', getStudents);
router.post('/attendance', markAttendance);
router.post('/grades', submitGrades);
router.get('/assignments', getAssignments);
// Update to handle file uploads - allow up to 5 attachment files
router.post('/assignments', uploadAssignmentFiles.array('attachments', 5), createAssignment);
router.get('/assignments/:assignmentId/submissions', getSubmissionsForAssignment);
router.get('/announcements', getAnnouncements);
router.post('/announcements', postAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
// Library resources (teacher)
import { createLibraryResource, listMyLibraryResources } from '../controllers/teacherController.js';
router.get('/library', listMyLibraryResources);
router.post('/library', uploadLibraryFiles.single('file'), createLibraryResource);

export default router;
