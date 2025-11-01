import { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, FileText, BarChart3, Settings, Shield, Database, DollarSign, Library, GraduationCap, ClipboardList, Home, X, Search, Filter, Eye, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Fee Management States
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeFormData, setFeeFormData] = useState({
    title: '',
    amount: '',
    description: '',
    dueDate: '',
    semester: 'Annual',
    appliesTo: 'all',
    grades: []
  });
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [feesLoading, setFeesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ total: 0, completed: 0, totalAmount: 0 });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError('');
      try {
        const res = await adminAPI.getUsers();
        // Expecting res.data to be either { users: [...] } or [...]
        const raw = Array.isArray(res.data) ? res.data : (res.data?.users || []);
        // Normalize to UI shape
        const normalized = raw.map((u) => ({
          id: u._id || u.id,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          role: (u.role || u.type || 'student').toLowerCase(),
          phone: u.phone || u.mobile || 'N/A',
          status: (u.status || 'active').toLowerCase(),
          dateOfBirth: u.dateOfBirth || u.dob || '—',
          enrollmentDate: u.enrollmentDate || u.joinedAt || u.createdAt || '—',
          joinDate: u.joinDate || u.hiredAt || u.createdAt || '—',
          grade: u.grade || u.classLevel || undefined,
          subject: u.subject || u.department || undefined,
          address: u.address || '—',
        }));
        setUsers(normalized);
        setFilteredUsers(normalized);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsersError(err.response?.data?.message || err.message || 'Failed to fetch users');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch fees and payments when fees module is active
  useEffect(() => {
    if (activeModule === 'fees') {
      fetchFees();
      fetchPayments();
    }
  }, [activeModule]);

  // Filter payments
  useEffect(() => {
    let result = payments;

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      result = result.filter(p => p.paymentMethod === paymentMethodFilter);
    }

    // Filter by status
    if (paymentStatusFilter !== 'all') {
      result = result.filter(p => p.status === paymentStatusFilter);
    }

    // Search by student name or email
    if (paymentSearchQuery.trim()) {
      result = result.filter(p =>
        p.studentName.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
        p.studentEmail.toLowerCase().includes(paymentSearchQuery.toLowerCase())
      );
    }

    setFilteredPayments(result);
  }, [paymentSearchQuery, paymentMethodFilter, paymentStatusFilter, payments]);

  // Fetch functions
  const fetchFees = async () => {
    setFeesLoading(true);
    try {
      const res = await adminAPI.getFees();
      setFees(res.data?.fees || []);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await adminAPI.getPayments({});
      setPayments(res.data?.payments || []);
      setFilteredPayments(res.data?.payments || []);
      setPaymentStats(res.data?.stats || { total: 0, completed: 0, totalAmount: 0 });
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createFee(feeFormData);
      if (res.data.success) {
  setShowFeeForm(false);
  setFeeFormData({ title: '', amount: '', description: '', dueDate: '', semester: 'Annual', appliesTo: 'all', grades: [] });
        fetchFees();
        alert('Fee created successfully!');
      }
    } catch (err) {
      console.error('Failed to create fee:', err);
      alert(err.response?.data?.message || 'Failed to create fee');
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await adminAPI.deleteFee(feeId);
      if (res.data.success) {
        fetchFees();
        alert('Fee deleted successfully!');
      }
    } catch (err) {
      console.error('Failed to delete fee:', err);
      alert(err.response?.data?.message || 'Failed to delete fee');
    }
  };

  // Filter and search users
  useEffect(() => {
    let result = users;

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Search by name or email
    if (searchQuery.trim()) {
      result = result.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const modules = [
    { id: 'home', icon: Home, title: 'Home', description: 'Overview and statistics' },
    { id: 'users', icon: Users, title: 'User Management', description: 'Manage students, teachers & staff' },
    { id: 'courses', icon: BookOpen, title: 'Course Management', description: 'Create and manage courses' },
    { id: 'timetable', icon: Calendar, title: 'Timetable', description: 'Schedule classes and events' },
    { id: 'attendance', icon: ClipboardList, title: 'Attendance', description: 'View all attendance data' },
    { id: 'fees', icon: DollarSign, title: 'Fee Management', description: 'Manage fee structure & payments' },
    { id: 'classes', icon: GraduationCap, title: 'Class Management', description: 'Manage classes and sections' },
    { id: 'requests', icon: Mail, title: 'Manage Requests', description: 'View and respond to user requests' },
    { id: 'security', icon: Shield, title: 'Security & Roles', description: 'Manage permissions' },
    { id: 'settings', icon: Settings, title: 'System Settings', description: 'Configure system preferences' },
  ];

  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
        return (
          <div>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-purple-100">Complete control over your school management system.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Teachers</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{users.filter(u => u.role === 'teacher').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Courses</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">42</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">$485K</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveModule('users')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 group-hover:text-purple-900 font-medium">Add New User</span>
                </button>
                <button
                  onClick={() => setActiveModule('courses')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 group-hover:text-purple-900 font-medium">Create Course</span>
                </button>
                <button
                  onClick={() => setActiveModule('reports')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 group-hover:text-purple-900 font-medium">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div>
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                  <p className="text-slate-600 mt-1">Manage students, teachers, and staff members</p>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Total Teachers</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {users.filter(u => u.role === 'teacher').length}
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
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {usersLoading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : usersError ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-red-600">
                          {usersError}
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                user.role === 'student' ? 'bg-blue-500' : user.role === 'teacher' ? 'bg-green-500' : 'bg-purple-500'
                              }`}>
                                {(user.name || '?').charAt(0)}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-500">{user.phone || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-slate-900">{user.email}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'student' 
                                ? 'bg-blue-100 text-blue-800' 
                                : user.role === 'teacher'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="text-purple-600 hover:text-purple-900 font-medium flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No users found matching your criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Details Modal */}
            {showUserDetails && selectedUser && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${
                        selectedUser.role === 'student' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {selectedUser.name.charAt(0)}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                      <p className="text-slate-600 mt-1">{selectedUser.email}</p>
                      <div className="flex items-center justify-center space-x-2 mt-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.role === 'student' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                        </span>
                         
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Email Address</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Phone Number</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Date of Birth</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.dateOfBirth}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Address</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.address}</p>
                          </div>
                        </div>

                        {selectedUser.role === 'student' && (
                          <>
                            <div className="flex items-start space-x-3">
                              <GraduationCap className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.grade}</p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Enrollment Date</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.enrollmentDate}</p>
                              </div>
                            </div>
                          </>
                        )}

                        {selectedUser.role === 'teacher' && (
                          <>
                            <div className="flex items-start space-x-3">
                              <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Subject</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.subject}</p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Join Date</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.joinDate}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-6 border-t border-slate-200">
                        <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                          Edit User
                        </button>
                        <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                          View History
                        </button>
                        <button className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'fees':
        return (
          <div>
            {/* Fee Management Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Fee Management</h2>
                  <p className="text-slate-600 mt-1">Set fees and track all student payments</p>
                </div>
                <button
                  onClick={() => setShowFeeForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Set New Fee</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{paymentStats.total}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Completed Payments</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{paymentStats.completed}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-purple-600 text-sm font-medium">Total Amount Collected</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">₹{paymentStats.totalAmount?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            {/* Current Fees List */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Current Fees</h3>
              {feesLoading ? (
                <p className="text-slate-500 text-center py-8">Loading fees...</p>
              ) : fees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fees.map((fee) => (
                    <div key={fee._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 flex-1">{fee.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            fee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {fee.status}
                          </span>
                          <button
                            onClick={() => handleDeleteFee(fee._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete fee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 mb-2">₹{fee.amount}</p>
                      <p className="text-sm text-slate-600 mb-2">{fee.description}</p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                        <p>Semester: {fee.semester}</p>
                        <p>
                          Scope: {fee.appliesTo === 'all' ? 'All students' : `Grades: ${(fee.grades || []).join(', ')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No fees set yet. Click "Set New Fee" to create one.</p>
              )}
            </div>

            {/* Payment Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Payment Records</h3>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name or email..."
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Payment Method Filter */}
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="UPI">UPI</option>
                  <option value="Check">Check</option>
                </select>

                {/* Status Filter */}
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading payments...</td>
                      </tr>
                    ) : filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{payment.studentName}</p>
                              <p className="text-xs text-slate-500">{payment.studentEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">{payment.feeTitle}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-purple-600">₹{payment.amount}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No payments found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fee Form Modal */}
            {showFeeForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                  <button
                    onClick={() => setShowFeeForm(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Set New Fee</h2>
                    <form onSubmit={handleCreateFee} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fee Title</label>
                        <input
                          type="text"
                          required
                          value={feeFormData.title}
                          onChange={(e) => setFeeFormData({ ...feeFormData, title: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Tuition Fee - Fall 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={feeFormData.amount}
                          onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="5000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                          value={feeFormData.description}
                          onChange={(e) => setFeeFormData({ ...feeFormData, description: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows="3"
                          placeholder="Optional description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          required
                          value={feeFormData.dueDate}
                          onChange={(e) => setFeeFormData({ ...feeFormData, dueDate: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                        <select
                          value={feeFormData.semester}
                          onChange={(e) => setFeeFormData({ ...feeFormData, semester: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Annual">Annual</option>
                          <option value="Fall">Fall</option>
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                        </select>
                      </div>

                      {/* Applies To: All vs Grade-specific */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Applies To</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFeeFormData({ ...feeFormData, appliesTo: 'all', grades: [] })}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeFormData.appliesTo === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            All Students
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeeFormData({ ...feeFormData, appliesTo: 'grade-specific' })}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeFormData.appliesTo === 'grade-specific' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            Specific Grades
                          </button>
                        </div>
                      </div>

                      {/* Grade multi-select when grade-specific */}
                      {feeFormData.appliesTo === 'grade-specific' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Grades</label>
                          <div className="grid grid-cols-6 gap-2">
                            {[...Array(12)].map((_, i) => {
                              const g = String(i + 1);
                              const selected = feeFormData.grades.includes(g);
                              return (
                                <button
                                  type="button"
                                  key={g}
                                  onClick={() => {
                                    const grades = selected
                                      ? feeFormData.grades.filter(x => x !== g)
                                      : [...feeFormData.grades, g];
                                    setFeeFormData({ ...feeFormData, grades });
                                  }}
                                  className={`text-sm py-2 rounded border ${selected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                  {g}
                                </button>
                              );
                            })}
                          </div>
                          {feeFormData.grades.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">Select at least one grade.</p>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Create Fee
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'courses':
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Management</h2>
            <p className="text-slate-600">Create and manage all courses in the system.</p>
            <div className="mt-6 p-8 bg-slate-50 rounded-lg text-center">
              <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-slate-500">Course management features coming soon...</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {modules.find(m => m.id === activeModule)?.title}
            </h2>
            <p className="text-slate-600">
              {modules.find(m => m.id === activeModule)?.description}
            </p>
            <div className="mt-6 p-8 bg-slate-50 rounded-lg text-center">
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-slate-500">This feature is under development...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Admin Portal" userRole="admin" />

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
                    ? 'bg-purple-600 text-white shadow-md'
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
