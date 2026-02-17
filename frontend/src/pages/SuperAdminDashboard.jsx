import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import api from '../services/api';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  BookOpen,
  GraduationCap
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sidebar modules
  const modules = [
    { id: 'home', title: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/home' },
    { id: 'schools', title: 'Schools', icon: Building2, path: '/superadmin/schools' },
    { id: 'statistics', title: 'Statistics', icon: BarChart3, path: '/superadmin/statistics' },
    { id: 'settings', title: 'Settings', icon: Settings, path: '/superadmin/settings' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, statsRes] = await Promise.all([
        api.get('/superadmin/dashboard'),
        api.get('/superadmin/statistics')
      ]);
      
      setDashboardData({
        ...dashboardRes.data.data,
        platformStats: statsRes.data.data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setActiveTab('details');
  };

  const handleUpdateSchoolStatus = async (schoolId, status) => {
    const id = schoolId || selectedSchool?._id || selectedSchool?.id;
    if (!id) {
      console.error('Cannot update school status: missing school id');
      return;
    }

    try {
      await api.patch(`/superadmin/schools/${id}/status`, { status });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating school status:', error);
    }
  };

  // Filter schools based on search and status
  const filteredSchools = (dashboardData?.schools || []).filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         school.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Main content rendering based on route
  const renderMainContent = () => {
    switch (location.pathname) {
      case '/superadmin':
      case '/superadmin/home':
        return (
          <div>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">Platform Control Center</h1>
              <p className="text-red-100">Complete oversight of all schools and platform-wide operations.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Schools</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{dashboardData?.totalSchools || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">{dashboardData?.activeSchools || 0} active</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{dashboardData?.totalStudents || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Across all schools</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Teachers</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{dashboardData?.totalTeachers || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Across all schools</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Courses</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{dashboardData?.totalCourses || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Active courses</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Subscription Distribution</h2>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardData?.subscriptionStats || {}).map(([plan, count]) => (
                  <div key={plan} className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                    <div className="text-3xl font-bold text-slate-900">{count}</div>
                    <div className="text-sm text-slate-600 capitalize mt-1">{plan} Plan</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/superadmin/schools')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                  <Building2 className="w-5 h-5 text-red-600" />
                  <span className="text-slate-700 group-hover:text-red-900 font-medium">Manage Schools</span>
                </button>
                <button
                  onClick={() => navigate('/superadmin/statistics')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  <span className="text-slate-700 group-hover:text-red-900 font-medium">View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        );

      case '/superadmin/schools':
        return (
          <div>
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">School Management</h2>
                  <p className="text-slate-600 mt-1">Manage all schools on the platform</p>
                </div>
                <button 
                  onClick={() => setShowCreateSchool(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add School</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Total Schools</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {dashboardData?.totalSchools || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {dashboardData?.activeSchools || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p className="text-yellow-600 text-sm font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">
                    {(dashboardData?.schools || []).filter(s => s.status === 'inactive').length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <p className="text-red-600 text-sm font-medium">Suspended</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {(dashboardData?.schools || []).filter(s => s.status === 'suspended').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search schools by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredSchools.length} of {dashboardData?.schools?.length || 0} schools
              </div>
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredSchools.map((school) => {
                    const schoolId = school._id || school.id;
                    return (
                    <tr key={schoolId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{school.name}</div>
                          <div className="text-sm text-slate-500">{school.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{school.code}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          <div>👨‍🎓 {school.stats?.totalStudents || 0}</div>
                          <div>👨‍🏫 {school.stats?.totalTeachers || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {school.subscription?.plan || 'trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={school.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleSchoolClick(school)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateSchoolStatus(schoolId, school.status === 'active' ? 'suspended' : 'active')}
                          className="text-orange-600 hover:text-orange-900"
                          title={school.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {school.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        );

      case '/superadmin/statistics':
        return (
          <div>
            <PlatformStatistics stats={dashboardData?.platformStats} />
          </div>
        );

      case '/superadmin/settings':
        return (
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Platform Settings</h2>
              <p className="text-slate-600">Settings management coming soon...</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold">Page not found</h2>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading platform dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="EduAxis Platform" userRole="superadmin" />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 min-h-screen transition-all duration-300 sticky top-0`}>
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-4 flex items-center justify-center hover:bg-slate-50 transition-colors border-b border-slate-200"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Navigation Modules */}
          <nav className="p-4 space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = location.pathname === module.path || 
                             (module.path === '/superadmin/home' && location.pathname === '/superadmin');
              
              return (
                <button
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  {sidebarOpen && (
                    <span className="font-medium">{module.title}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>

      <DashboardFooter />
      
      {/* Modals */}
      {showCreateSchool && (
        <CreateSchoolModal
          onClose={() => setShowCreateSchool(false)}
          onSuccess={() => {
            setShowCreateSchool(false);
            fetchDashboardData();
          }}
        />
      )}

      {selectedSchool && (
        <SchoolDetailsModal
          school={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onUpdateStatus={handleUpdateSchoolStatus}
          fetchDashboardData={fetchDashboardData}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} rounded-full w-16 h-16 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-medium text-sm ${
      active
        ? 'border-b-2 border-blue-600 text-blue-600'
        : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

// Schools List Component
const SchoolsList = ({ schools, onSchoolClick, onUpdateStatus, onCreateSchool }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchools = schools.filter(school => {
    const matchesFilter = filter === 'all' || school.status === filter;
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={onCreateSchool}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add School
        </button>
      </div>

      {/* Schools Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teachers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-50 cursor-pointer">
                <td
                  onClick={() => onSchoolClick(school)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  <div className="text-sm font-medium text-gray-900">{school.name}</div>
                  <div className="text-sm text-gray-500">{school.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {school.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {school.stats.totalStudents}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {school.stats.totalTeachers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {school.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={school.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateStatus(school.id, e.target.value)}
                    value={school.status}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]} capitalize`}>
      {status}
    </span>
  );
};

// Platform Statistics Component
const PlatformStatistics = ({ stats }) => {
  if (!stats) return <div>Loading...</div>;

  const totalSchools = stats.schools?.total || 0;
  const activeSchools = stats.schools?.active || 0;

  const totalUsers = stats.users?.total || 0;
  const totalStudents = stats.users?.students || 0;
  const totalTeachers = stats.users?.teachers || 0;
  const totalAdmins = stats.users?.admins || 0;

  const totalCourses = stats.resources?.courses || 0;
  const totalAssignments = stats.resources?.assignments || 0;
  const totalAttendance = stats.resources?.attendanceRecords || 0;

  const billing = stats.billing || {};
  const currency = billing.currency || stats.revenue?.currency || 'INR';
  const formatMoney = (value) => {
    const normalized = Number(value) || 0;
    return currency === 'INR'
      ? `Rs${normalized.toLocaleString('en-IN')}`
      : `${normalized.toLocaleString()}`;
  };

  const monthlyRevenue = stats.revenue?.estimatedMonthly || 0;
  const annualRevenue = stats.revenue?.estimatedAnnual || 0;
  const projectedMonthlyRevenue = billing.projected?.monthlyIfAllActiveSchoolsCharged || monthlyRevenue;
  const billableSchools = billing.summary?.billableSchools || 0;

  const conversionRate = activeSchools > 0 ? ((billableSchools / activeSchools) * 100).toFixed(1) : '0.0';
  const schoolActivationRate = totalSchools > 0 ? ((activeSchools / totalSchools) * 100).toFixed(1) : '0.0';
  const arpu = billableSchools > 0 ? Math.round(monthlyRevenue / billableSchools) : 0;

  const userMix = [
    { label: 'Students', value: totalStudents, color: 'bg-blue-500' },
    { label: 'Teachers', value: totalTeachers, color: 'bg-emerald-500' },
    { label: 'Admins', value: totalAdmins, color: 'bg-violet-500' }
  ];

  const resourceMix = [
    { label: 'Courses', value: totalCourses, color: 'bg-orange-500' },
    { label: 'Assignments', value: totalAssignments, color: 'bg-rose-500' },
    { label: 'Attendance', value: totalAttendance, color: 'bg-cyan-500' }
  ];

  const userPieData = [
    { label: 'Students', value: totalStudents, color: '#3b82f6' },
    { label: 'Teachers', value: totalTeachers, color: '#10b981' },
    { label: 'Admins', value: totalAdmins, color: '#8b5cf6' }
  ];

  const maxUserMix = Math.max(...userMix.map(item => item.value), 1);
  const maxResourceMix = Math.max(...resourceMix.map(item => item.value), 1);

  const starterTier = billing.tiers?.starter || { monthlyFee: 1999, maxStudents: 300 };
  const growthTier = billing.tiers?.growth || { monthlyFee: 4999, maxStudents: 1000 };
  const scaleTier = billing.tiers?.scale || { baseMonthlyFee: 4999, additionalPerStudent: 8, includedStudents: 1000 };

  const revenueLineLabels = ['Now', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5'];
  const revenueLineValues = Array.from({ length: 6 }, (_, i) => {
    const start = monthlyRevenue;
    const end = projectedMonthlyRevenue;
    const value = start + ((end - start) * i) / 5;
    return Math.max(0, Math.round(value));
  });

  const pieData = {
    labels: userPieData.map(item => item.label),
    datasets: [
      {
        data: userPieData.map(item => item.value),
        backgroundColor: userPieData.map(item => item.color),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const lineData = {
    labels: revenueLineLabels,
    datasets: [
      {
        label: 'MRR Projection',
        data: revenueLineValues,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444'
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => formatMoney(context.parsed.y || 0)
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatMoney(value)
        },
        grid: {
          color: '#e2e8f0'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 rounded-2xl p-7 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Platform Analytics Intelligence</h2>
            <p className="text-red-100 mt-2">
              Operational metrics + monetization strategy in one view.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Growth month: +{stats.growth?.newUsersThisMonth || 0} users</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Schools</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalSchools}</p>
          <p className="text-xs text-slate-500 mt-2">{schoolActivationRate}% active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalUsers.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">{totalStudents.toLocaleString()} students</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Billable Schools</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-2">{billableSchools} billable / {activeSchools} active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Estimated MRR</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{formatMoney(monthlyRevenue)}</p>
          <p className="text-xs text-slate-500 mt-2">ARPU: {formatMoney(arpu)}/billable school</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Users Mix (Pie)</h3>
          <div className="h-64">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="mt-4 space-y-2">
            {userPieData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">MRR Projection Graph</h3>
          <p className="text-sm text-slate-500 mb-4">
            Scenario trend from current MRR to projected opportunity.
          </p>
          <div className="h-72">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">User Distribution</h3>
          <div className="space-y-4">
            {userMix.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.value / maxUserMix) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">Resource Footprint</h3>
          <div className="space-y-4">
            {resourceMix.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.value / maxResourceMix) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">Revenue & Growth Snapshot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Estimated Monthly</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{formatMoney(monthlyRevenue)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Estimated Annual</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{formatMoney(annualRevenue)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">New Schools (30d)</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.growth?.newSchoolsThisMonth || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">New Users (30d)</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.growth?.newUsersThisMonth || 0}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">MRR Opportunity (Scenario)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {formatMoney(projectedMonthlyRevenue)}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              If all active schools are charged using per-student INR billing.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing Tier Mix</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Starter Schools</span>
              <span className="font-semibold text-slate-900">{billing.summary?.starterSchools || 0}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${billableSchools > 0 ? ((billing.summary?.starterSchools || 0) / billableSchools) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-slate-600">Growth Schools</span>
              <span className="font-semibold text-slate-900">{billing.summary?.growthSchools || 0}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${billableSchools > 0 ? ((billing.summary?.growthSchools || 0) / billableSchools) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-slate-600">Scale Schools</span>
              <span className="font-semibold text-slate-900">{billing.summary?.scaleSchools || 0}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${billableSchools > 0 ? ((billing.summary?.scaleSchools || 0) / billableSchools) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900">Student-Based INR Pricing</h3>
          <span className="text-xs text-slate-500">Fair usage billing model</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">Starter</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{formatMoney(starterTier.monthlyFee)}</p>
            <p className="text-xs text-slate-500">per school/month</p>
            <ul className="mt-4 text-sm text-slate-700 space-y-2">
              <li>Up to {starterTier.maxStudents} students</li>
              <li>Core admin + attendance</li>
              <li>Email support</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-blue-500 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">Growth</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{formatMoney(growthTier.monthlyFee)}</p>
            <p className="text-xs text-blue-700">per school/month</p>
            <ul className="mt-4 text-sm text-blue-900 space-y-2">
              <li>Up to {growthTier.maxStudents} students</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">Scale</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{formatMoney(scaleTier.baseMonthlyFee)}</p>
            <p className="text-xs text-slate-500">base/month + {formatMoney(scaleTier.additionalPerStudent)}/student</p>
            <ul className="mt-4 text-sm text-slate-700 space-y-2">
              <li>After {scaleTier.includedStudents} students</li>
              <li>Custom branding + API access</li>
              <li>Dedicated account manager</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// School Details Component
const SchoolDetails = ({ school, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{school.name}</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Close
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Basic Information</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-600">Code:</dt><dd className="font-medium">{school.code}</dd></div>
            <div><dt className="text-gray-600">Email:</dt><dd className="font-medium">{school.email}</dd></div>
            <div><dt className="text-gray-600">Phone:</dt><dd className="font-medium">{school.phone}</dd></div>
            <div><dt className="text-gray-600">Status:</dt><dd><StatusBadge status={school.status} /></dd></div>
          </dl>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Statistics</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-600">Students:</dt><dd className="font-medium">{school.stats.totalStudents}</dd></div>
            <div><dt className="text-gray-600">Teachers:</dt><dd className="font-medium">{school.stats.totalTeachers}</dd></div>
            <div><dt className="text-gray-600">Admins:</dt><dd className="font-medium">{school.stats.totalAdmins}</dd></div>
            <div><dt className="text-gray-600">Courses:</dt><dd className="font-medium">{school.stats.totalCourses}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
};

// Create School Modal Component
const CreateSchoolModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    allowedEmailDomains: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    principal: {
      name: '',
      email: '',
      phone: ''
    },
    adminUser: {
      name: '',
      email: '',
      password: '',
      phone: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Convert comma-separated domains to array
      const payload = {
        ...formData,
        allowedEmailDomains: formData.allowedEmailDomains
          .split(',')
          .map(d => d.trim().toLowerCase())
          .filter(d => d)
      };
      
      await api.post('/superadmin/schools', payload);
      onSuccess();
    } catch (error) {
      console.error('Error creating school:', error);
      setError(error.response?.data?.message || 'Error creating school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New School</h2>
                <p className="text-sm text-slate-600">Set up a new school on the platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Information */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">School Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Harvard University"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                    placeholder="HARV001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="contact@harvard.edu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Allowed Email Domains (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.allowedEmailDomains}
                    onChange={(e) => setFormData({ ...formData, allowedEmailDomains: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="harvard.edu, student.harvard.edu"
                  />
                  <p className="mt-1 text-xs text-slate-500">Students with these email domains can auto-register for this school</p>
                </div>
              </div>
            </div>

            {/* Admin User Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Initial Admin User</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Create the first admin account for this school</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminUser.name}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      adminUser: { ...formData.adminUser, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.adminUser.email}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      adminUser: { ...formData.adminUser, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@harvard.edu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.adminUser.password}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      adminUser: { ...formData.adminUser, password: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Phone</label>
                  <input
                    type="tel"
                    value={formData.adminUser.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      adminUser: { ...formData.adminUser, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create School & Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
