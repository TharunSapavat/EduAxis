import { BookOpen, Users, Calendar, FileText, BarChart3, ClipboardList, Bell, Library, DollarSign, Home, X, Notebook } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    attendance: 0,
    currentGrade: '-',
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModule, setActiveModule] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const studentId = user?._id || user?.id || user?.studentId;
      
      if (!studentId) {
        throw new Error('Student ID not found');
      }

      const response = await studentAPI.getDashboard(studentId);
      
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { id: 'home', icon: Home, title: 'Dashboard', description: 'Overview and statistics' },
    { id: 'courses', icon: BookOpen, title: 'My Courses', description: 'View enrolled courses' },
    { id: 'grades', icon: BarChart3, title: 'Grades', description: 'Check your performance' },
    { id: 'attendance', icon: ClipboardList, title: 'Attendance', description: 'View attendance records' },
    { id: 'assignments', icon: FileText, title: 'Assignments', description: 'Submit and track assignments' },
    { id: 'timetable', icon: Calendar, title: 'Timetable', description: 'View class schedule' },
    { id: 'announcements', icon: Bell, title: 'Announcements', description: 'Stay updated' },
    { id: 'upload notes', icon: Notebook, title: 'Upload Notes', description: 'Upload your class notes' },
    { id: 'fees', icon: DollarSign, title: 'Fees', description: 'View and pay fees' },
  ];

  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'Student'}!
              </h1>
              <p className="text-blue-100">Here's your academic overview for today</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={fetchDashboardData}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Courses</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {loading ? '...' : stats.totalCourses}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Attendance</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {loading ? '...' : `${stats.attendance}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Current Grade</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {loading ? '...' : stats.currentGrade}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Pending Tasks</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {loading ? '...' : stats.pendingAssignments}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveModule('assignments')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Assignments</p>
                </button>
                <button
                  onClick={() => setActiveModule('timetable')}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
                >
                  <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Timetable</p>
                </button>
                <button
                  onClick={() => setActiveModule('grades')}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Grades</p>
                </button>
                <button
                  onClick={() => setActiveModule('announcements')}
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
                >
                  <Bell className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Announcements</p>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'courses':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">My Courses</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((course) => (
                <div key={course} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Course {course}</h3>
                      <p className="text-sm text-slate-600">Instructor Name</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'assignments':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Assignments</h1>
            <div className="space-y-4">
              {[1, 2, 3].map((assignment) => (
                <div key={assignment} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">Assignment {assignment}</h3>
                      <p className="text-sm text-slate-600 mt-1">Course Name • Due: Nov 15, 2025</p>
                      <p className="text-sm text-slate-700 mt-2">Description of the assignment goes here...</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                      Submit
                    </button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {modules.find(m => m.id === activeModule)?.icon && 
                React.createElement(modules.find(m => m.id === activeModule).icon, {
                  className: "w-8 h-8 text-blue-600"
                })
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {modules.find(m => m.id === activeModule)?.title}
            </h2>
            <p className="text-slate-600 mb-6">This feature is coming soon!</p>
            <button 
              onClick={() => setActiveModule('home')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
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
      <DashboardHeader title="Student Portal" userRole="student" />

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
                    ? 'bg-blue-600 text-white shadow-md'
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
