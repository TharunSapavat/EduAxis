import { BookOpen, Users, Calendar, FileText, BarChart3, ClipboardList, Bell, Library, DollarSign, Home, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
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

  // Module-specific states
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [library, setLibrary] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Course Details Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);

  // Fee Management States
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeSummary, setFeeSummary] = useState({
    totalFees: 0,
    totalPaid: 0,
    pending: 0,
    lateFees: 0,
    totalDue: 0
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: 'Cash',
    transactionId: '',
    remarks: ''
  });
  const [feesLoading, setFeesLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Initialize Socket.IO connection once
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io('http://localhost:5000', { withCredentials: true });
      socketRef.current = socket;
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, []);

  useEffect(() => {
    if (user && activeModule === 'fees') {
      fetchFeeData();
    }
  }, [user, activeModule]);

  // Fetch data when switching modules
  useEffect(() => {
    if (!user) return;

    switch (activeModule) {
      case 'courses':
        fetchCourses();
        break;
      case 'grades':
        fetchGrades();
        break;
      case 'attendance':
        fetchAttendance();
        break;
      case 'assignments':
        fetchAssignments();
        break;
      case 'timetable':
        fetchTimetable();
        break;
      case 'announcements':
        fetchAnnouncements();
        break;
      case 'library':
        fetchLibrary();
        break;
      case 'leave':
        fetchLeaveRequests();
        break;
      default:
        break;
    }
  }, [user, activeModule]);

  // Realtime: Listen for attendance updates and refresh when relevant
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || activeModule !== 'attendance') return;
    const handler = (payload) => {
      const myId = user?._id || user?.id || user?.studentId;
      if (!myId) return;
      if (String(payload.studentId) === String(myId)) {
        fetchAttendance();
      }
    };
    socket.on('attendanceUpdated', handler);
    return () => {
      socket.off('attendanceUpdated', handler);
    };
  }, [activeModule, user]);

  // Realtime: Listen for assignment creation events (teacher emits) and refresh if viewing assignments
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;
    const handler = (payload) => {
      // Only react if assignment targets the student's grade
      if (!payload || String(payload.grade) !== String(user.grade)) return;
      // Refresh list if on assignments module; else skip to avoid unnecessary requests
      if (activeModule === 'assignments') {
        fetchAssignments();
      }
    };
    socket.on('assignmentCreated', handler);
    return () => {
      socket.off('assignmentCreated', handler);
    };
  }, [activeModule, user]);

  // Realtime: Listen for announcement creation events (teacher posts) and refresh if viewing announcements
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;
    const handler = (payload) => {
      // Only react if announcement is for student's grade
      if (!payload || String(payload.grade) !== String(user.grade)) return;
      // Refresh announcements if on that module
      if (activeModule === 'announcements') {
        fetchAnnouncements();
      }
    };
    socket.on('announcementCreated', handler);
    return () => {
      socket.off('announcementCreated', handler);
    };
  }, [activeModule, user]);

  const fetchFeeData = async () => {
    try {
      setFeesLoading(true);
      const response = await studentAPI.getFees();
      
      if (response.data.success) {
        setFees(response.data.fees || []);
        setPayments(response.data.payments || []);
        setFeeSummary(response.data.summary || {
          totalFees: 0,
          totalPaid: 0,
          pending: 0,
          lateFees: 0,
          totalDue: 0
        });
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
    } finally {
      setFeesLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFee) return;

    try {
      setFeesLoading(true);
      
      // Calculate late fee
      const now = new Date();
      const dueDate = new Date(selectedFee.dueDate);
      let lateFee = 0;
      
      if (now > dueDate) {
        const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        lateFee = daysLate * 10; // ₹10 per day
      }
      
      const paymentData = {
        feeId: selectedFee._id,
        amount: selectedFee.amount,
        paymentMethod: paymentFormData.paymentMethod,
        transactionId: paymentFormData.transactionId,
        remarks: paymentFormData.remarks
      };

      const response = await studentAPI.makePayment(paymentData);
      
      if (response.data.success) {
        const totalPaid = selectedFee.amount + (response.data.lateFee || 0);
        showNotification(
          `Payment successful! Total paid: ₹${totalPaid.toLocaleString()} | Receipt #: ${response.data.payment.receiptNumber}`,
          'success'
        );
        setShowPaymentForm(false);
        setSelectedFee(null);
        setPaymentFormData({
          paymentMethod: 'Cash',
          transactionId: '',
          remarks: ''
        });
        fetchFeeData(); // Refresh fee data
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      showNotification(error.response?.data?.message || 'Failed to submit payment', 'error');
    } finally {
      setFeesLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await studentAPI.downloadReceipt(paymentId);
      
      if (response.data.success) {
        const receipt = response.data.receipt;
        // For now, show receipt details in alert (later we'll generate PDF)
        alert(`Receipt: ${receipt.receiptNumber}\nAmount: ₹${receipt.amount}\nDate: ${new Date(receipt.paymentDate).toLocaleDateString()}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  };

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

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await studentAPI.getCourses();
      console.log('Courses response:', response.data);
      if (response.data.success) {
        setCourses(response.data.courses || []);
      } else {
        showNotification(response.data.message || 'Failed to load courses', 'error');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load courses';
      showNotification(errorMsg, 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch Course Details
  const fetchCourseDetails = async (courseId) => {
    try {
      setCourseDetailsLoading(true);
      setCourseDetails(null);
      const response = await studentAPI.getCourseDetails(courseId);
      if (response.data.success) {
        setCourseDetails(response.data.course);
      } else {
        showNotification(response.data.message || 'Failed to load course details', 'error');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load course details';
      showNotification(errorMsg, 'error');
    } finally {
      setCourseDetailsLoading(false);
    }
  };

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
    if (course?._id) {
      fetchCourseDetails(course._id);
    }
  };

  // Fetch Grades
  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getGrades(studentId);
      if (response.data.success) {
        setGrades(response.data.grades || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      showNotification('Failed to load grades', 'error');
    } finally {
      setGradesLoading(false);
    }
  };

  // Fetch Attendance
  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getAttendance(studentId);
      if (response.data.success) {
        setAttendance(response.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('Failed to load attendance', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch Assignments
  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getAssignments(studentId);
      if (response.data.success) {
        setAssignments(response.data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showNotification('Failed to load assignments', 'error');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Fetch Timetable
  const fetchTimetable = async () => {
    try {
      setTimetableLoading(true);
      const response = await studentAPI.getTimetable();
      if (response.data.success) {
        setTimetable(response.data.timetable);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      showNotification('Failed to load timetable', 'error');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const response = await studentAPI.getAnnouncements();
      if (response.data.success) {
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showNotification('Failed to load announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Fetch Library
  const fetchLibrary = async () => {
    try {
      setLibraryLoading(true);
      const response = await studentAPI.getLibrary();
      console.log('Library response:', response.data);
      if (response.data.success) {
        setLibrary(response.data.library);
      } else {
        showNotification(response.data.message || 'Failed to load library', 'error');
      }
    } catch (error) {
      console.error('Error fetching library:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load library';
      showNotification(errorMsg, 'error');
    } finally {
      setLibraryLoading(false);
    }
  };

  // Fetch Leave Requests
  const fetchLeaveRequests = async () => {
    try {
      setLeaveRequestsLoading(true);
      const response = await studentAPI.getLeaveRequests();
      if (response.data.success) {
        setLeaveRequests(response.data.leaveRequests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      showNotification('Failed to load leave requests', 'error');
    } finally {
      setLeaveRequestsLoading(false);
    }
  };

  // Submit leave request
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await studentAPI.createLeaveRequest(leaveFormData);
      if (response.data.success) {
        showNotification('Leave request submitted successfully', 'success');
        setShowLeaveForm(false);
        setLeaveFormData({ type: 'casual', startDate: '', endDate: '', reason: '' });
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showNotification(error.response?.data?.message || 'Failed to submit leave request', 'error');
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
    { id: 'library', icon: Library, title: 'Library', description: 'Access resources' },
    { id: 'fees', icon: DollarSign, title: 'Fees', description: 'View and pay fees' },
    { id: 'leave', icon: Calendar, title: 'Leave Requests', description: 'Apply & track leave' },
  ];

  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
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
              </div>
            </div>
          </div>
        );
      
      case 'courses':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">My Courses</h1>
            {coursesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No courses enrolled yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{course.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">Code: {course.code}</p>
                        <p className="text-sm text-slate-600">
                          {course.teacherId?.name || 'Instructor TBA'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        course.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status || 'Active'}
                      </span>
                    </div>
                    
                    {course.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                    )}
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openCourseDetails(course)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'assignments':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Assignments</h1>
            {assignmentsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No assignments at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const dueDate = new Date(assignment.dueDate);
                  const isOverdue = dueDate < new Date();
                  const isPending = assignment.status === 'active' || assignment.status === 'pending';
                  
                  return (
                    <div key={assignment._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {assignment.courseId?.name || assignment.subject} • 
                            Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {assignment.totalMarks && ` • ${assignment.totalMarks} marks`}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-slate-700 mt-2">{assignment.description}</p>
                          )}
                          {assignment.teacherId?.name && (
                            <p className="text-xs text-slate-500 mt-2">By: {assignment.teacherId.name}</p>
                          )}
                          {assignment.attachments?.length > 0 && (
                            <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-slate-700 mb-2">📎 Attachments:</p>
                              <ul className="space-y-1">
                                {assignment.attachments.map((att, idx) => {
                                  // Support both file uploads (with path) and URL-based attachments
                                  const fileUrl = att.path 
                                    ? `http://localhost:5000${att.path}` 
                                    : att.url;
                                  const fileName = att.name || `Attachment ${idx + 1}`;
                                  const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                                  
                                  return (
                                    <li key={idx}>
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm hover:underline"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>{fileName}{fileSize}</span>
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-4 ${
                          isOverdue && isPending
                            ? 'bg-red-100 text-red-700'
                            : isPending
                            ? 'bg-orange-100 text-orange-700'
                            : assignment.status === 'graded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isOverdue && isPending ? 'Overdue' : assignment.status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={() => {
                            // TODO: Implement assignment submission modal
                            showNotification('Assignment submission feature coming soon!', 'info');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          {isPending ? 'Submit' : 'View Submission'}
                        </button>
                        <button 
                          onClick={() => {
                            showNotification('Assignment details coming soon!', 'info');
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'fees':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Fee Management</h1>

            {/* Fee Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Total Fees</p>
                <p className="text-2xl font-bold text-slate-900">₹{feeSummary.totalFees?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{feeSummary.totalPaid?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-600">₹{feeSummary.pending?.toLocaleString() || 0}</p>
              </div>
                 <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Late Fee</p>
                <p className="text-2xl font-bold text-orange-600">₹{feeSummary.lateFee?.toLocaleString() || 0}</p>
              </div>
          
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Total Due</p>
                <p className="text-2xl font-bold text-blue-600">₹{feeSummary.totalDue?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* Active Fees */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Active Fees</h2>
              {feesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-slate-600 mt-2">Loading fees...</p>
                </div>
              ) : fees.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
                  <p className="text-slate-600">No active fees at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fees.map((fee) => {
                    const isPaid = payments.some(p => p.feeId === fee._id && p.status === 'completed');
                    const isOverdue = new Date(fee.dueDate) < new Date() && !isPaid;
                    
                    return (
                      <div key={fee._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{fee.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{fee.description}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            isPaid 
                              ? 'bg-green-100 text-green-700' 
                              : isOverdue 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-bold text-slate-900">₹{fee.amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Due Date:</span>
                            <span className="font-medium text-slate-900">
                              {new Date(fee.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {fee.semester && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Semester:</span>
                              <span className="font-medium text-slate-900">{fee.semester}</span>
                            </div>
                          )}
                        </div>

                        {!isPaid && (
                          <button
                            onClick={() => {
                              setSelectedFee(fee);
                              setShowPaymentForm(true);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Payment History</h2>
              {payments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
                  <p className="text-slate-600">No payment history</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Receipt #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fee</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {payment.receiptNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {payment.feeTitle}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                              ₹{payment.amount?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {payment.paymentMethod}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-700'
                                  : payment.status === 'pending'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDownloadReceipt(payment._id)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Form Modal */}
            {showPaymentForm && selectedFee && (() => {
              // Calculate late fee
              const now = new Date();
              const dueDate = new Date(selectedFee.dueDate);
              let lateFee = 0;
              let daysLate = 0;
              
              if (now > dueDate) {
                daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                lateFee = daysLate * 10; // ₹10 per day
              }
              
              const totalAmount = selectedFee.amount + lateFee;
              
              return (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm bg-opacity-50  flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Make Payment</h2>
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setSelectedFee(null);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-bold text-slate-900 mb-3">{selectedFee.title}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Fee Amount:</span>
                            <span className="font-bold">₹{selectedFee.amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Due Date:</span>
                            <span className={daysLate > 0 ? 'text-red-600 font-medium' : ''}>
                              {new Date(selectedFee.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {lateFee > 0 && (
                            <>
                              <div className="flex justify-between text-red-600">
                                <span>Late Fee ({daysLate} days × ₹10):</span>
                                <span className="font-bold">₹{lateFee?.toLocaleString()}</span>
                              </div>
                              <div className="pt-2 mt-2 border-t border-slate-300 flex justify-between">
                                <span className="text-slate-900 font-bold">Total Amount:</span>
                                <span className="font-bold text-blue-600 text-lg">₹{totalAmount?.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Payment Method *
                        </label>
                        <select
                          value={paymentFormData.paymentMethod}
                          onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Online Payment">Online Payment</option>
                          <option value="UPI">UPI</option>
                          <option value="Check">Check</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Transaction ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentFormData.transactionId}
                          onChange={(e) => setPaymentFormData({...paymentFormData, transactionId: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter transaction ID if applicable"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Remarks (Optional)
                        </label>
                        <textarea
                          value={paymentFormData.remarks}
                          onChange={(e) => setPaymentFormData({...paymentFormData, remarks: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows="3"
                          placeholder="Any additional notes"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPaymentForm(false);
                            setSelectedFee(null);
                          }}
                          className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={feesLoading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {feesLoading ? 'Processing...' : 'Submit Payment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            );
            })()}
          </div>
        );

      case 'grades':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Grades & Performance</h1>
              <button
                onClick={fetchGrades}
                disabled={gradesLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${gradesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {gradesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading grades...</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No grades available yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Assignment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Feedback</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {grades.map((grade, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {grade.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {grade.assignment}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {grade.marks}/{grade.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                              grade.grade.startsWith('A') 
                                ? 'bg-green-100 text-green-700'
                                : grade.grade.startsWith('B')
                                ? 'bg-blue-100 text-blue-700'
                                : grade.grade.startsWith('C')
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {grade.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                            {grade.feedback ? (
                              <span title={grade.feedback} className="line-clamp-2">
                                {grade.feedback}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(grade.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'attendance':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Attendance Records</h1>
            {attendanceLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading attendance...</p>
              </div>
            ) : !attendance ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No attendance records found</p>
              </div>
            ) : (
              <div>
                {/* Attendance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Overall</p>
                    <p className="text-2xl font-bold text-blue-600">{attendance.overall}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-orange-600">{attendance.late || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-900">{attendance.total}</p>
                  </div>
                </div>

                {/* Attendance Records */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Detailed Records</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {attendance.records?.map((record) => (
                          <tr key={record._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {record.courseId?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                record.status === 'present' 
                                  ? 'bg-green-100 text-green-700'
                                  : record.status === 'absent'
                                  ? 'bg-red-100 text-red-700'
                                  : record.status === 'late'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'timetable':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Class Timetable</h1>
            {timetableLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading timetable...</p>
              </div>
            ) : !timetable ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No timetable available</p>
              </div>
            ) : (
              <div>
                {/* Timetable Info */}
                <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
                  <h2 className="text-xl font-bold mb-2">
                    Grade {timetable.grade} - Section {timetable.section}
                  </h2>
                  <p className="text-blue-100">
                    {timetable.academicYear} • {timetable.semester} Semester
                  </p>
                </div>

                {/* Today's Classes */}
                {timetable.todaySchedule && timetable.todaySchedule.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Today's Classes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timetable.todaySchedule.map((cls, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900">{cls.subject}</h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {cls.startTime} - {cls.endTime}
                              </p>
                              <p className="text-sm text-slate-600">Room: {cls.room}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              cls.type === 'lab' 
                                ? 'bg-purple-100 text-purple-700'
                                : cls.type === 'tutorial'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {cls.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Week Schedule */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                        const dayClasses = timetable.schedule?.filter(cls => cls.day === day) || [];
                        if (dayClasses.length === 0) return null;

                        return (
                          <div key={day}>
                            <h3 className="font-bold text-slate-900 mb-3">{day}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {dayClasses.map((cls, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <p className="font-semibold text-slate-900 text-sm">{cls.subject}</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {cls.startTime} - {cls.endTime}
                                  </p>
                                  <p className="text-xs text-slate-600">Room: {cls.room}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {timetable.message && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{timetable.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'announcements':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Announcements</h1>
            {announcementsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No announcements at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            announcement.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {announcement.priority?.toUpperCase() || 'NORMAL'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          By {announcement.createdBy?.name || 'Teacher'} • {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'library':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Library Resources</h1>
            {libraryLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading library...</p>
              </div>
            ) : !library ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Library className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">Library resources not available</p>
              </div>
            ) : (
              <div>
                {/* Library Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Available Resources</p>
                    <p className="text-2xl font-bold text-blue-600">{library.availableResources?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Currently Borrowed</p>
                    <p className="text-2xl font-bold text-orange-600">{library.currentBorrowed || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Borrowing Limit</p>
                    <p className="text-2xl font-bold text-slate-900">{library.borrowingLimit || 5}</p>
                  </div>
                </div>

                {/* Borrowed Books */}
                {library.borrowedBooks && library.borrowedBooks.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Currently Borrowed</h2>
                    <div className="space-y-3">
                      {library.borrowedBooks.map((book) => (
                        <div key={book.id} className="bg-white p-4 rounded-lg shadow-md border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900">{book.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">
                                Borrowed: {new Date(book.borrowedDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-slate-600">
                                Due: {new Date(book.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              new Date(book.dueDate) < new Date()
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {new Date(book.dueDate) < new Date() ? 'Overdue' : 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Resources */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Available Resources</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {library.availableResources?.map((resource) => (
                      <div key={resource.id} className="bg-white p-6 rounded-lg shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{resource.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {resource.type} • {resource.subject}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {resource.format}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-slate-600 mb-3">{resource.description}</p>
                        )}
                        {resource.availableOnline && (
                          <button
                            onClick={() => showNotification('Download feature coming soon!', 'info')}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Download Resource
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'leave':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Leave Requests</h1>
              <button
                onClick={() => setShowLeaveForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Calendar className="w-4 h-4" />
                Apply for Leave
              </button>
            </div>

            {leaveRequestsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading leave requests...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No leave requests yet</p>
                <p className="text-slate-500 text-sm mt-2">Click "Apply for Leave" to submit your first request</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {leaveRequests.map((req) => (
                  <div key={req._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 capitalize">{req.type} Leave</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()} ({req.days} day{req.days > 1 ? 's' : ''})
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2"><span className="font-medium">Reason:</span> {req.reason}</p>
                    {req.reviewRemarks && (
                      <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded"><span className="font-medium">Admin Remarks:</span> {req.reviewRemarks}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-3">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Leave Form Modal */}
            {showLeaveForm && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Apply for Leave</h2>
                    <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleLeaveSubmit} className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                        <select
                          value={leaveFormData.type}
                          onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="casual">Casual</option>
                          <option value="sick">Sick</option>
                          <option value="personal">Personal</option>
                          <option value="emergency">Emergency</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={leaveFormData.startDate}
                          onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                        <input
                          type="date"
                          value={leaveFormData.endDate}
                          onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                        <textarea
                          value={leaveFormData.reason}
                          onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                          rows="4"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Explain why you need leave..."
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowLeaveForm(false)}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Student Portal" userRole="student" />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 max-w-md ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Course Details Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Course Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedCourse && fetchCourseDetails(selectedCourse._id)}
                  disabled={courseDetailsLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${courseDetailsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setShowCourseModal(false);
                    setSelectedCourse(null);
                    setCourseDetails(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {courseDetailsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-slate-600 mt-4">Loading course details...</p>
                </div>
              ) : !courseDetails ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No details available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{courseDetails.name}</h3>
                      <p className="text-slate-600 mt-1">Code: {courseDetails.code}</p>
                      {courseDetails.teacherId?.name && (
                        <p className="text-slate-600 mt-1">Instructor: {courseDetails.teacherId.name}{courseDetails.teacherId.email ? ` • ${courseDetails.teacherId.email}` : ''}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-500">Credits</p>
                        <p className="text-lg font-bold text-slate-900">{courseDetails.credits ?? '-'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-500">Semester</p>
                        <p className="text-lg font-bold text-slate-900">{courseDetails.semester ?? '-'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center col-span-2">
                        <p className="text-xs text-slate-500">Status</p>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${courseDetails.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{courseDetails.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {courseDetails.description && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{courseDetails.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Assignments */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Most Recent Assignment</h4>
                      {courseDetails.recentAssignments && courseDetails.recentAssignments.length > 0 ? (
                        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <p className="font-medium text-slate-900">{courseDetails.recentAssignments[0].title}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            Due: {new Date(courseDetails.recentAssignments[0].dueDate).toLocaleDateString()} • {courseDetails.recentAssignments[0].totalMarks || 100} marks
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No recent assignments</p>
                      )}
                    </div>

                    {/* Recent Announcements */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Most Recent Announcement</h4>
                      {courseDetails.recentAnnouncements && courseDetails.recentAnnouncements.length > 0 ? (
                        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <p className="font-medium text-slate-900">{courseDetails.recentAnnouncements[0].title}</p>
                          <p className="text-sm text-slate-600 mt-1">{new Date(courseDetails.recentAnnouncements[0].createdAt).toLocaleDateString()}</p>
                          {courseDetails.recentAnnouncements[0].content && (
                            <p className="text-sm text-slate-700 mt-1 line-clamp-3">{courseDetails.recentAnnouncements[0].content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No recent announcements</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
