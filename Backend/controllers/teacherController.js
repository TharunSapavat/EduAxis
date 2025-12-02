import { db } from '../models/database.js';
import Submission from '../models/Submission.js';
import LibraryResource from '../models/LibraryResource.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import Announcement from '../models/Announcement.js';
import Timetable from '../models/Timetable.js';
import LeaveRequest from '../models/LeaveRequest.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Schedule from '../models/Schedule.js';

// Get teacher dashboard data
export const getDashboard = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    
    // Find courses assigned to this teacher
    const teacherCourses = await Course.find({ teacherId });
    const courseIds = teacherCourses.map(c => c._id);
    
    // Calculate total students across all teacher's courses
    const uniqueGrades = [...new Set(teacherCourses.map(c => c.grade))];
    const totalStudents = await User.countDocuments({
      role: 'student',
      grade: { $in: uniqueGrades }
    });
    
    // Calculate pending grading (submissions not yet graded)
    const pendingGrading = await Submission.countDocuments({
      assignmentId: { 
        $in: await Assignment.find({ 
          courseId: { $in: courseIds } 
        }).distinct('_id') 
      },
      grade: null
    });
    
    // Calculate classes today from schedule
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    const classesToday = await Schedule.countDocuments({
      teacherId,
      dayOfWeek
    });
    
    res.json({
      stats: {
        totalCourses: teacherCourses.length,
        totalStudents,
        pendingGrading,
        classesToday
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teacher courses
export const getCourses = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    
    // Find all courses assigned to this teacher
    const courses = await Course.find({ teacherId }).sort({ grade: 1, name: 1 });
    
    // Calculate actual student count for each course based on grade
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await User.countDocuments({
          role: 'student',
          grade: course.grade
        });
        
        return {
          ...course.toObject(),
          students: studentCount
        };
      })
    );
    
    res.json({ 
      success: true,
      courses: coursesWithStudentCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get students list
export const getStudents = async (req, res) => {
  try {
    const { courseId, grade } = req.query;
    
    let query = { role: 'student' };
    
    // If courseId is provided, find the course and filter by its grade
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }
      query.grade = course.grade;
    } 
    // If grade is provided directly, filter by grade
    else if (grade) {
      query.grade = Number(grade);
    }
    
    // Fetch students with optional filtering
    const students = await User.find(query)
      .select('name email studentId grade')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { studentId, courseId, status, date, remarks } = req.body;

    if (!studentId || !courseId || !status) {
      return res.status(400).json({ success: false, message: 'studentId, courseId and status are required' });
    }
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    // Normalize date to day granularity to prevent duplicates for same day
    const d = date ? new Date(date) : new Date();
    const dateNormalized = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    // Upsert attendance record for the day
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, courseId, date: dateNormalized },
      {
        $set: {
          status,
          remarks: remarks || '',
          markedBy: teacherId
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('courseId', 'name code');

    // Emit realtime update to clients
    const io = req.app.get('io');
    if (io) {
      io.emit('attendanceUpdated', {
        studentId: String(studentId),
        courseId: String(courseId),
        record: attendance
      });
    }

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get attendance for a course on a specific day (defaults to today)
export const getAttendanceForCourse = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { courseId, date } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    const course = await Course.findById(courseId).select('teacherId');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (String(course.teacherId) !== String(teacherId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to view attendance for this course' });
    }

    const d = date ? new Date(date) : new Date();
    const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 1));

    const records = await Attendance.find({
      courseId,
      date: { $gte: startOfDay, $lt: endOfDay }
    })
      .select('studentId status remarks date')
      .populate('studentId', 'name email studentId grade');

    res.json({ success: true, records });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Submit grades
export const submitGrades = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { assignmentId, studentId, marks, feedback } = req.body;

    if (!assignmentId || !studentId || typeof marks !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'assignmentId, studentId and numeric marks are required'
      });
    }

    // Validate teacher exists (optional; role middleware already ensures role)
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Load assignment to validate totalMarks and optional relationships
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Bounds check for marks
    const totalMarks = assignment.totalMarks || 100;
    if (marks < 0 || marks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${totalMarks}`
      });
    }

    // Find existing submission; if not present, create one so grades can be recorded
    let submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      submission = new Submission({
        assignmentId,
        studentId,
        status: 'submitted',
        submittedAt: new Date()
      });
    }

    submission.marks = marks;
    submission.feedback = feedback || submission.feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;
    await submission.save();

    res.json({
      success: true,
      message: 'Grade recorded successfully',
      submission
    });
  } catch (error) {
    console.error('Submit grades error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get teacher timetable (all timetables for active classes)
export const getTeacherTimetable = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    if (!teacherId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const now = new Date();
    // Find courses taught by this teacher
    const courses = await Course.find({ teacherId }).select('grade section');
    
    if (courses.length === 0) {
      return res.json({ success: true, timetables: [], message: 'No courses assigned' });
    }

    // Build query for all classes this teacher teaches
    const classQueries = courses.map(c => ({
      grade: String(c.grade),
      section: c.section || 'All'
    }));

    // Also include 'All' section timetables for each grade
    const grades = [...new Set(courses.map(c => String(c.grade)))];
    grades.forEach(grade => {
      classQueries.push({ grade, section: 'All' });
    });

    // Find active timetables for those classes
    const timetables = await Timetable.find({
      isActive: true,
      effectiveFrom: { $lte: now },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: now } }
      ],
      $and: [
        {
          $or: classQueries
        }
      ]
    }).select('grade section academicYear semester file effectiveFrom effectiveTo');

    res.json({ success: true, timetables });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create or update a class schedule entry
export const createScheduleEntry = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const { courseId, grade, subject, dayOfWeek, startTime, endTime, room } = req.body;

    if (!teacherId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!courseId || !grade || !subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course || String(course.teacherId) !== String(teacherId)) {
      return res.status(403).json({ success: false, message: 'You can only schedule classes for your courses' });
    }

    // Optional overlap check: ensure no overlapping times for same teacher and day
    const overlap = await Schedule.findOne({
      teacherId,
      dayOfWeek,
      $or: [
        { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }] }
      ]
    });
    if (overlap) {
      return res.status(409).json({ success: false, message: 'Time slot overlaps with an existing class' });
    }

    const entry = await Schedule.create({
      teacherId,
      courseId,
      grade: String(grade),
      subject,
      dayOfWeek,
      startTime,
      endTime,
      room: room || ''
    });

    // Emit realtime schedule update to all clients
    try {
      const io = req.app.get('io');
      if (io) {
        await entry.populate('courseId', 'name code grade');
        // Include a concise payload with routing hints so teacher UIs for the same grade/course can refetch
        io.emit('scheduleUpdated', {
          entry,
          courseId: String(entry.courseId?._id || courseId),
          grade: String(entry.grade),
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime
        });
      }
    } catch (e) {
      console.warn('Socket emit (scheduleUpdated) failed:', e.message);
    }

    res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error('Create schedule entry error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// List weekly schedule for teacher (optionally by course)
export const getMySchedule = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const { courseId } = req.query;
    if (!teacherId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Find courses taught by this teacher
    const myCourses = await Course.find({ teacherId }).select('_id grade');
    const myCourseIds = myCourses.map(c => c._id);
    const myGrades = [...new Set(myCourses.map(c => String(c.grade)))];

    // Build query: include own entries, and entries for courses this teacher teaches
    const query = { $or: [ { teacherId }, { courseId: { $in: myCourseIds } }, { grade: { $in: myGrades } } ] };
    if (courseId) {
      // Narrow to a specific course if provided
      query.$and = [{ courseId }];
    }

    const entries = await Schedule.find(query)
      .populate({ path: 'courseId', select: 'name code grade teacherId', populate: { path: 'teacherId', select: 'name email' } })
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, entries });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get assignments (real data)
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const assignments = await Assignment.find({ teacherId })
      .populate('courseId', 'name code grade')
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// List student submissions for a specific assignment
export const getSubmissionsForAssignment = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: 'assignmentId is required' });
    }

    // Verify the assignment belongs to this teacher
    const assignment = await Assignment.findById(assignmentId).populate('courseId', 'name code grade teacherId');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (String(assignment.teacherId) !== String(teacherId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to view submissions for this assignment' });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'name email studentId grade section')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    // Ensure all submissions have the correct structure
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      assignmentId: sub.assignmentId,
      studentId: sub.studentId,
      content: sub.content || '',
      comments: sub.comments || '',
      files: sub.files || [],
      attachments: sub.attachments || sub.files || [],
      submittedAt: sub.submittedAt,
      status: sub.status,
      marks: sub.marks,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt,
      gradedBy: sub.gradedBy
    }));

    res.json({ success: true, submissions: formattedSubmissions, assignment: {
      _id: assignment._id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      courseId: assignment.courseId
    }});
  } catch (error) {
    console.error('Get submissions for assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Teacher: Create library resource (auto-publish for their grade/course)
export const createLibraryResource = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { title, description, author, category, tags, grade = 'All', courseId, linkUrl } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const resource = new LibraryResource({
      title,
      description: description || '',
      author: author || '',
      category: category || 'General',
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [],
      grade: String(grade || 'All'),
      courseId: courseId || undefined,
      isExternal: !!linkUrl,
      linkUrl: linkUrl || '',
      createdBy: teacherId,
      isActive: true
    });

    if (req.file) {
      resource.file = {
        path: `/uploads/library/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    await resource.save();
    res.status(201).json({ success: true, message: 'Resource published', resource });
  } catch (error) {
    console.error('Create library resource error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const listMyLibraryResources = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const resources = await LibraryResource.find({ createdBy: teacherId, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    console.error('List library resources error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    // Data comes from multipart form, so fields are in req.body and files in req.files
    const { title, description, courseId, dueDate, totalMarks } = req.body;
    
    if (!title || !courseId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, courseId and dueDate are required' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (String(course.teacherId) !== String(teacherId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to create assignment for this course' });
    }
    
    // Process uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          name: file.originalname,
          filename: file.filename, // stored filename on server
          path: `/uploads/assignments/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }

    const assignment = await Assignment.create({
      title,
      description: description || '',
      subject: course.name,
      grade: String(course.grade),
      section: 'All',
      teacherId,
      courseId,
      dueDate: new Date(dueDate),
      totalMarks: totalMarks ? Number(totalMarks) : 100,
      attachments,
      status: 'active'
    });
    
    await assignment.populate('courseId', 'name code grade');
    
    // Emit realtime socket event so students (by grade) can refresh assignments list
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('assignmentCreated', {
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            totalMarks: assignment.totalMarks,
            courseId: assignment.courseId, // populated doc
            attachments: assignment.attachments,
            status: assignment.status,
            grade: assignment.grade
          },
          grade: assignment.grade,
          courseId: String(assignment.courseId?._id || assignment.courseId),
        });
      }
    } catch (e) {
      console.warn('Socket emit (assignmentCreated) failed:', e.message);
    }
    
    res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Post announcement
export const postAnnouncement = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { title, content, targetAudience, priority, courseId } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course is required' 
      });
    }

    // Find the course to get the grade
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Verify teacher owns this course
    if (String(course.teacherId) !== String(teacherId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not allowed to post announcement for this course' 
      });
    }

    // Create announcement in database
    const announcement = await Announcement.create({
      title,
      content,
      createdBy: teacherId,
      createdByRole: 'teacher',
      targetAudience: targetAudience || 'students',
      priority: priority || 'normal',
      courseId,
      grade: String(course.grade),
      isActive: true
    });

    // Populate creator details and course
    await announcement.populate('createdBy', 'name email');
    await announcement.populate('courseId', 'name code grade');

    // Emit realtime socket event for students of this grade
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('announcementCreated', {
          announcement: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            createdBy: announcement.createdBy,
            courseId: announcement.courseId,
            grade: announcement.grade,
            createdAt: announcement.createdAt
          },
          grade: announcement.grade
        });
      }
    } catch (e) {
      console.warn('Socket emit (announcementCreated) failed:', e.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      announcement
    });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get teacher's announcements
export const getAnnouncements = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    
    const announcements = await Announcement.find({ 
      createdBy: teacherId,
      isActive: true 
    })
      .populate('courseId', 'name code grade')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    const { id } = req.params;
    
    // Find announcement
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Announcement not found' 
      });
    }
    
    // Verify teacher owns this announcement
    if (String(announcement.createdBy) !== String(teacherId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this announcement' 
      });
    }
    
    // Soft delete by setting isActive to false
    announcement.isActive = false;
    await announcement.save();
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      requesterId: teacherId,
      requesterRole: 'teacher',
      type: leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: 'pending'
    });

    await leaveRequest.save();

    // Populate requester info
    await leaveRequest.populate('requesterId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveRequest
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get teacher's leave requests
export const getLeaveRequests = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    const requests = await LeaveRequest.find({ requesterId: teacherId })
      .populate('requesterId', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leaveRequests: requests
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Upload study material
export const uploadStudyMaterial = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { title, description, grade, courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!title || !grade || !courseId) {
      return res.status(400).json({ success: false, message: 'Title, grade, and course are required' });
    }

    // Verify the course belongs to the teacher
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      return res.status(403).json({ success: false, message: 'You can only upload materials for your courses' });
    }

    const studyMaterial = new StudyMaterial({
      title,
      description,
      grade: parseInt(grade),
      courseId,
      subject: course.name,
      fileUrl: `/uploads/study-materials/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: teacherId
    });

    await studyMaterial.save();

    res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully',
      material: studyMaterial
    });
  } catch (error) {
    console.error('Upload study material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get study materials uploaded by teacher
export const getMyStudyMaterials = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    const materials = await StudyMaterial.find({ uploadedBy: teacherId })
      .populate('uploadedBy', 'name email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      materials
    });
  } catch (error) {
    console.error('Get study materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete study material
export const deleteStudyMaterial = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    const { id } = req.params;

    const material = await StudyMaterial.findOne({ _id: id, uploadedBy: teacherId });
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Study material not found' });
    }

    await StudyMaterial.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Study material deleted successfully'
    });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
