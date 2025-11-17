import { BookOpen, ClipboardList, BarChart3, FileText, Calendar, Bell, MessageSquare } from 'lucide-react';

export default function StudentHome({ user, stats, loading, error, fetchDashboardData, setActiveModule }) {
  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 text-white">
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
          <button
            onClick={() => setActiveModule('messages')}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-center"
          >
            <MessageSquare className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">Messages</p>
          </button>
        </div>
      </div>
    </div>
  );
}
