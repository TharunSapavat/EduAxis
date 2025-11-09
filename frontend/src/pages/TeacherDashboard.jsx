import { BookOpen, Users, Calendar, FileText, BarChart3, ClipboardList, Bell, Upload, MessageSquare, Home, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { teacherAPI } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherStats, setTeacherStats] = useState({ totalCourses: 0, totalStudents: 0, pendingGrading: 0, classesToday: 0 });
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Course Management Modal
  const [showCourseManageModal, setShowCourseManageModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Students List
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [courseForStudentView, setCourseForStudentView] = useState(null);

  // Attendance state
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMarking, setAttendanceMarking] = useState({});

  const modules = [
    { id: 'home', icon: Home, title: 'Dashboard', description: 'Overview and statistics' },
    { id: 'courses', icon: BookOpen, title: 'My Courses', description: 'Manage your courses' },
    { id: 'attendance', icon: ClipboardList, title: 'Mark Attendance', description: 'Record student attendance' },
    { id: 'grading', icon: BarChart3, title: 'Assignments', description: 'Grade submissions' },
    { id: 'students', icon: Users, title: 'Student Lists', description: 'View students' },
    { id: 'announcements', icon: Bell, title: 'Announcements', description: 'Post announcements' },
    { id: 'materials', icon: Upload, title: 'Study Materials', description: 'Upload resources' },
    { id: 'timetable', icon: Calendar, title: 'My Timetable', description: 'View schedule' },
    { id: 'messages', icon: MessageSquare, title: 'Messages', description: 'Communicate with students' },
  ];

  // Load teacher dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const res = await teacherAPI.getDashboard(user?.id);
        setTeacherStats(res.data.stats || { totalCourses: 0, totalStudents: 0, pendingGrading: 0, classesToday: 0 });
      } catch (err) {
        console.error('Failed to load teacher stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [user]);

  // Load teacher courses when viewing Home, Courses, Attendance, Grading or Announcements
  useEffect(() => {
    if (!user) return;
    const shouldFetch = ['home','courses','attendance','grading','announcements'].includes(activeModule);
    if (!shouldFetch) return;

    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await teacherAPI.getCourses(user?.id);
        setTeacherCourses(res.data.courses || []);
      } catch (err) {
        console.error('Failed to load teacher courses', err);
        setTeacherCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [user, activeModule]);

  // When switching to Attendance, default select first course
  useEffect(() => {
    if (activeModule !== 'attendance') return;
    if (!attendanceCourseId && teacherCourses.length > 0) {
      setAttendanceCourseId(teacherCourses[0]._id);
    }
  }, [activeModule, teacherCourses, attendanceCourseId]);

  // Load students for selected course in Attendance
  useEffect(() => {
    if (activeModule !== 'attendance' || !attendanceCourseId) return;
    const load = async () => {
      setAttendanceLoading(true);
      try {
        const res = await teacherAPI.getStudents({ courseId: attendanceCourseId });
        setAttendanceStudents(res.data.students || []);
      } catch (e) {
        console.error('Failed to load students for attendance', e);
        setAttendanceStudents([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    load();
  }, [activeModule, attendanceCourseId]);

  // Mark attendance helper
  const markAttendanceStatus = async (studentId, status) => {
    if (!attendanceCourseId) return;
    try {
      setAttendanceMarking(prev => ({ ...prev, [studentId]: true }));
      await teacherAPI.markAttendance({ studentId, courseId: attendanceCourseId, status });
    } catch (e) {
      console.error('Failed to mark attendance', e);
    } finally {
      setAttendanceMarking(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Handle course management
  const handleManageCourse = (course) => {
    setSelectedCourse(course);
    setShowCourseManageModal(true);
  };

  // Fetch students for a course
  const fetchStudentsForCourse = async (course) => {
    try {
      setStudentsLoading(true);
      const response = await teacherAPI.getStudents({ courseId: course._id });
      if (response.data.success) {
        setStudents(response.data.students || []);
        setCourseForStudentView(course);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Handle view student list
  const handleViewStudentList = (course) => {
    setShowCourseManageModal(false);
    fetchStudentsForCourse(course);
    setActiveModule('students');
  };

  // Render main content
  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-6 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome, {user?.name || 'Teacher'}!
              </h1>
              <p className="text-green-100">Manage your classes and students effectively</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">My Courses</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{statsLoading ? '—' : teacherStats.totalCourses}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{statsLoading ? '—' : teacherStats.totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Pending Grading</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{statsLoading ? '—' : teacherStats.pendingGrading}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Classes Today</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{statsLoading ? '—' : teacherStats.classesToday}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveModule('attendance')}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
                >
                  <ClipboardList className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Mark Attendance</p>
                </button>
                <button
                  onClick={() => setActiveModule('grading')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
                >
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Grade Work</p>
                </button>
                <button
                  onClick={() => setActiveModule('announcements')}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
                >
                  <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Post Announcement</p>
                </button>
                <button
                  onClick={() => setActiveModule('materials')}
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
                >
                  <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Upload Material</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">My Courses</h1>
            {coursesLoading ? (
              <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">Loading courses...</div>
            ) : teacherCourses.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">No courses assigned yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teacherCourses.map((course) => (
                  <div key={course._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{course.name} <span className="text-slate-500 text-sm">({course.code})</span></h3>
                        <p className="text-sm text-slate-600">Grade {course.grade} • {course.students || 0} Students</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-700' : course.status === 'inactive' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                        {course.status?.toUpperCase()}
                      </span>
                    </div>
                    {course.description && (
                      <p className="text-sm text-slate-700 mb-4 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleManageCourse(course)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Manage
                      </button>
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'attendance':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Mark Attendance</h1>
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
                <select
                  value={attendanceCourseId}
                  onChange={(e) => setAttendanceCourseId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {coursesLoading ? (
                    <option>Loading courses...</option>
                  ) : teacherCourses.length > 0 ? (
                    teacherCourses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
                    ))
                  ) : (
                    <option>No courses assigned</option>
                  )}
                </select>
              </div>
              {attendanceLoading ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-600">Loading students...</div>
              ) : attendanceStudents.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-600">No students found for this course.</div>
              ) : (
                <div className="space-y-3">
                  {attendanceStudents.map((s, idx) => (
                    <div key={s._id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{s.name}</p>
                        <p className="text-sm text-slate-600">ID: {s.studentId || 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => markAttendanceStatus(s._id || s.id, 'present')}
                          disabled={!!attendanceMarking[s._id || s.id]}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => markAttendanceStatus(s._id || s.id, 'absent')}
                          disabled={!!attendanceMarking[s._id || s.id]}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'grading':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Assignments</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Assignment Form */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Create Assignment</h2>
                <CreateAssignmentForm 
                  courses={teacherCourses}
                  onCreated={() => {/* no-op; list component will refresh */}}
                />
              </div>

              {/* Assignment List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <TeacherAssignmentsList />
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Student List</h1>
                {courseForStudentView && (
                  <p className="text-slate-600 mt-1">
                    {courseForStudentView.name} • Grade {courseForStudentView.grade} • {courseForStudentView.code}
                  </p>
                )}
              </div>
              {courseForStudentView && (
                <button
                  onClick={() => {
                    setCourseForStudentView(null);
                    setStudents([]);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {studentsLoading ? (
              <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Students Found</h3>
                <p className="text-slate-600 mb-6">
                  {courseForStudentView 
                    ? `No students are enrolled in ${courseForStudentView.name} (Grade ${courseForStudentView.grade}).`
                    : 'Select a course from "My Courses" to view enrolled students.'}
                </p>
                <button
                  onClick={() => setActiveModule('courses')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  View My Courses
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                {/* Stats Header */}
                <div className="bg-linear-to-r from-green-600 to-green-700 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-green-100 text-sm">Total Enrolled Students</p>
                      <p className="text-3xl font-bold">{students.length}</p>
                    </div>
                  </div>
                </div>

                {/* Student List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {students.map((student, index) => (
                        <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-700 font-semibold text-sm">
                                  {student.name?.charAt(0).toUpperCase() || 'S'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{student.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {student.studentId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              Grade {student.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this course
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'announcements':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Post Announcement</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Announcement Form */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Create New Announcement</h2>
                <CreateAnnouncementForm courses={teacherCourses} />
              </div>

              {/* Recent Announcements */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">My Recent Announcements</h2>
                <TeacherAnnouncementsList />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {modules.find(m => m.id === activeModule)?.icon && 
                React.createElement(modules.find(m => m.id === activeModule).icon, {
                  className: "w-8 h-8 text-green-600"
                })
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {modules.find(m => m.id === activeModule)?.title}
            </h2>
            <p className="text-slate-600 mb-6">This feature is coming soon!</p>
            <button 
              onClick={() => setActiveModule('home')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Teacher Portal" userRole="teacher" />

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 min-h-screen overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeModule === module.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <module.icon className="w-5 h-5" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">{module.title}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Toggle Sidebar Button */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <p className="text-sm text-slate-600">
              {modules.find(m => m.id === activeModule)?.title || 'Dashboard'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <DashboardFooter />

      {/* Course Management Modal */}
      {showCourseManageModal && selectedCourse && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
                <p className="text-sm text-slate-600">Grade {selectedCourse.grade} • {selectedCourse.code}</p>
              </div>
              <button
                onClick={() => setShowCourseManageModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Course Stats */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Students Enrolled</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedCourse.students || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Credits</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedCourse.credits || 3}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Description */}
              {selectedCourse.description && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-2">Course Description</h3>
                  <p className="text-slate-700 text-sm">{selectedCourse.description}</p>
                </div>
              )}

              {/* Management Actions */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 mb-3">Course Management</h3>
                
                {/* Upload Assignment */}
                <button 
                  onClick={() => {
                    setShowCourseManageModal(false);
                    setActiveModule('grading');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Upload Assignment</p>
                    <p className="text-sm text-slate-600">Create and assign homework to students</p>
                  </div>
                </button>

                {/* Upload Study Materials */}
                <button 
                  onClick={() => {
                    setShowCourseManageModal(false);
                    setActiveModule('materials');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Upload Study Materials</p>
                    <p className="text-sm text-slate-600">Share notes, PDFs, and resources</p>
                  </div>
                </button>

                {/* Mark Attendance */}
                <button 
                  onClick={() => {
                    setShowCourseManageModal(false);
                    setActiveModule('attendance');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Mark Attendance</p>
                    <p className="text-sm text-slate-600">Record student attendance for this course</p>
                  </div>
                </button>

                {/* Post Announcement */}
                <button 
                  onClick={() => {
                    setShowCourseManageModal(false);
                    setActiveModule('announcements');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Post Announcement</p>
                    <p className="text-sm text-slate-600">Notify students about important updates</p>
                  </div>
                </button>

                {/* View Student List */}
                <button 
                  onClick={() => handleViewStudentList(selectedCourse)}
                  className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">View Student List</p>
                    <p className="text-sm text-slate-600">See all enrolled students for this course</p>
                  </div>
                </button>
              </div>

              {/* Close Button */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowCourseManageModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Assignment Form component
function CreateAssignmentForm({ courses, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', courseId: '', dueDate: '', totalMarks: 100 });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!form.courseId && courses && courses.length > 0) {
      setForm((f) => ({ ...f, courseId: courses[0]._id }));
    }
  }, [courses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'totalMarks' ? Number(value) : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachmentFiles(prev => [...prev, ...files]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.dueDate) {
      setMessage({ type: 'error', text: 'Title, Course and Due Date are required.' });
      return;
    }
    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('courseId', form.courseId);
      formData.append('dueDate', form.dueDate);
      formData.append('totalMarks', form.totalMarks);
      
      // Append all files
      attachmentFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await teacherAPI.createAssignment(formData);
      
      setMessage({ type: 'success', text: 'Assignment created successfully.' });
      setForm({ title: '', description: '', courseId: courses?.[0]?._id || '', dueDate: '', totalMarks: 100 });
      setAttachmentFiles([]);
      
      // Notify list to refresh
      window.dispatchEvent(new CustomEvent('assignment-created'));
      onCreated && onCreated();
    } catch (err) {
      console.error('Create assignment failed', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create assignment' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`px-3 py-2 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
        <select
          name="courseId"
          value={form.courseId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        >
          {courses?.length ? (
            courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
            ))
          ) : (
            <option value="">No courses</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g., Unit 1 Worksheet" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Brief instructions"></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
          <input type="number" min={1} max={1000} name="totalMarks" value={form.totalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>
      {/* Attachments */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Attachments (optional)</label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.zip"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {attachmentFiles.length > 0 && (
            <span className="text-sm text-slate-600 whitespace-nowrap">{attachmentFiles.length} file(s)</span>
          )}
        </div>
        {attachmentFiles.length > 0 && (
          <ul className="text-sm text-slate-700 space-y-1">
            {attachmentFiles.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
                <span className="truncate mr-2">
                  {file.name} <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </span>
                <button 
                  type="button" 
                  className="text-red-600 hover:text-red-800 text-xs font-medium" 
                  onClick={() => removeFile(idx)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">
          Accepted: PDF, Word, PowerPoint, Excel, Images, Text, ZIP (Max 10MB per file)
        </p>
      </div>
      <button disabled={submitting} className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium">
        {submitting ? 'Creating…' : 'Create Assignment'}
      </button>
    </form>
  );
}

// Teacher Assignments List component
function TeacherAssignmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await teacherAPI.getAssignments();
      setItems(res.data.assignments || []);
    } catch (e) {
      console.error('Failed to load assignments', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('assignment-created', handler);
    return () => window.removeEventListener('assignment-created', handler);
  }, []);

  if (loading) return <div className="text-slate-600">Loading assignments…</div>;
  if (!items.length) return <div className="text-slate-600">No assignments yet.</div>;

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a._id} className="p-4 border border-slate-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-600">{a.courseId?.name || a.subject} • Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'} • {a.totalMarks || 100} marks</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">{a.status?.toUpperCase() || 'ACTIVE'}</span>
          </div>
          {Array.isArray(a.attachments) && a.attachments.length > 0 && (
            <div className="mt-2 text-sm bg-slate-50 p-2 rounded">
              <p className="text-slate-700 font-medium mb-1">📎 Attachments ({a.attachments.length}):</p>
              <ul className="space-y-1">
                {a.attachments.map((att, i) => {
                  const fileUrl = att.path 
                    ? `http://localhost:5000${att.path}` 
                    : att.url;
                  const fileName = att.name || `Attachment ${i + 1}`;
                  const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                  
                  return (
                    <li key={i}>
                      <a 
                        className="text-blue-600 hover:underline inline-flex items-center gap-1" 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        download
                      >
                        <FileText className="w-3 h-3" />
                        {fileName}{fileSize}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Create Announcement Form component
function CreateAnnouncementForm({ courses }) {
  const [form, setForm] = useState({ courseId: '', title: '', content: '', targetAudience: 'students', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!form.courseId && courses && courses.length > 0) {
      setForm(f => ({ ...f, courseId: courses[0]._id }));
    }
  }, [courses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.courseId) {
      setMessage({ type: 'error', text: 'Course, title and content are required.' });
      return;
    }
    if (form.content.length < 10) {
      setMessage({ type: 'error', text: 'Content must be at least 10 characters long.' });
      return;
    }
    try {
      setSubmitting(true);
      await teacherAPI.postAnnouncement({
        courseId: form.courseId,
        title: form.title,
        content: form.content,
        targetAudience: form.targetAudience,
        priority: form.priority
      });
      setMessage({ type: 'success', text: 'Announcement posted successfully!' });
      setForm({ courseId: courses?.[0]?._id || '', title: '', content: '', targetAudience: 'students', priority: 'normal' });
      // Notify list to refresh
      window.dispatchEvent(new CustomEvent('announcement-created'));
    } catch (err) {
      console.error('Post announcement failed', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to post announcement' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`px-3 py-2 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
        <select
          name="courseId"
          value={form.courseId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          required
        >
          {courses?.length ? (
            courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
            ))
          ) : (
            <option value="">No courses</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input 
          name="title" 
          value={form.title} 
          onChange={handleChange} 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
          placeholder="e.g., Important Notice"
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Content <span className="text-slate-500 text-xs">(minimum 10 characters)</span>
        </label>
        <textarea 
          name="content" 
          value={form.content} 
          onChange={handleChange} 
          rows={4} 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
          placeholder="Write your announcement here..."
          minLength={10}
          required
        ></textarea>
        {form.content.length > 0 && form.content.length < 10 && (
          <p className="text-xs text-red-600 mt-1">
            {10 - form.content.length} more character{10 - form.content.length !== 1 ? 's' : ''} required
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
          <select 
            name="targetAudience" 
            value={form.targetAudience} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select 
            name="priority" 
            value={form.priority} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <button 
        disabled={submitting} 
        className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg font-medium"
      >
        {submitting ? 'Posting…' : 'Post Announcement'}
      </button>
    </form>
  );
}

// Teacher Announcements List component
function TeacherAnnouncementsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAnnouncements();
      setItems(response.data.announcements || []);
    } catch (e) {
      console.error('Failed to load announcements', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      setDeleting(id);
      await teacherAPI.deleteAnnouncement(id);
      setItems(items.filter(item => item._id !== id));
    } catch (e) {
      console.error('Failed to delete announcement', e);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('announcement-created', handler);
    return () => window.removeEventListener('announcement-created', handler);
  }, []);

  if (loading) return <div className="text-slate-600">Loading announcements…</div>;
  if (!items.length) return <div className="text-slate-600 text-sm">Your posted announcements will appear here.</div>;

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a._id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-slate-900 truncate">{a.title}</p>
                {a.courseId && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0">
                    {a.courseId.name} • Grade {a.courseId.grade}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${
                  a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  a.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  a.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {a.priority?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(a.createdAt).toLocaleDateString()} at {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(a._id)}
              disabled={deleting === a._id}
              className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete announcement"
            >
              {deleting === a._id ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

