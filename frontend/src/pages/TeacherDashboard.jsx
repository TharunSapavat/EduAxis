import { BookOpen, Users, Calendar, FileText, BarChart3, ClipboardList, Bell, Upload, MessageSquare, Home, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
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

  const modules = [
    { id: 'home', icon: Home, title: 'Dashboard', description: 'Overview and statistics' },
    { id: 'courses', icon: BookOpen, title: 'My Courses', description: 'Manage your courses' },
    { id: 'attendance', icon: ClipboardList, title: 'Mark Attendance', description: 'Record student attendance' },
    { id: 'grading', icon: BarChart3, title: 'Grade Assignments', description: 'Grade submissions' },
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

  // Load teacher courses when viewing Home or Courses
  useEffect(() => {
    if (!user) return;
    const shouldFetch = activeModule === 'home' || activeModule === 'courses';
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

  // Render main content
  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-6 text-white">
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
                      <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium">
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
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
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
              <div className="space-y-3">
                {['John Smith', 'Emma Wilson', 'Alex Rodriguez', 'Sarah Johnson', 'Michael Chen'].map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{student}</p>
                      <p className="text-sm text-slate-600">Roll No: {idx + 1}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                        Present
                      </button>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                Submit Attendance
              </button>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
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
    </div>
  );
}
