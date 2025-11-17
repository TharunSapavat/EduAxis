import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { X } from 'lucide-react';

// Context & API
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';

// Custom Hooks
import { useNotification } from '../hooks/useNotification';

// Components
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import StudentInbox from '../components/StudentInbox';
import NotificationToast from '../components/NotificationToast';
import CourseDetailsModal from '../components/student/CourseDetailsModal';
import StudentHome from '../components/student/StudentHome';
import StudentCourses from '../components/student/StudentCourses';
import StudentAssignments from '../components/student/StudentAssignments';
import StudentGrades from '../components/student/StudentGrades';
import StudentAttendance from '../components/student/StudentAttendance';
import StudentTimetable from '../components/student/StudentTimetable';
import StudentAnnouncements from '../components/student/StudentAnnouncements';
import StudentLibrary from '../components/student/StudentLibrary';
import StudentLeave from '../components/student/StudentLeave';
import StudentFees from '../components/student/StudentFees';

// Config
import { STUDENT_MODULES } from '../config/studentModules';

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
  const [activeModule, setActiveModule] = useState('home');///////
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
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const leaveRequestsPerPage = 5;

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
  
  // Custom hooks
  const { notification, showNotification, hideNotification } = useNotification();

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
      // Join room after socket connects if user present
      socket.on('connect', () => {
        if (user) {
          try { socket.emit('join', { userId: user._id || user.id || user.studentId }); } catch (err) { console.error(err); }
        }
      });
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
        setLeaveCurrentPage(1); // Reset to first page when opening leave module
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
    // Incoming private messages
    const msgHandler = (payload) => {
      const sender = payload?.sender?.name || payload?.sender?.email || 'Someone';
      const text = payload?.text || '';
      showNotification(`${sender}: ${text}`, 'success');
    };
    socket.on('message:received', msgHandler);
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
      socket.off('message:received', msgHandler);
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
  const fetchCourses = useCallback(async () => {
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
  }, [showNotification]);

  // Fetch Course Details
  const fetchCourseDetails = useCallback(async (courseId) => {
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
  }, [showNotification]);

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
    if (course?._id) {
      fetchCourseDetails(course._id);
    }
  };

  // Fetch Grades
  const fetchGrades = useCallback(async () => {
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
  }, [user, showNotification]);

  // Fetch Attendance
  const fetchAttendance = useCallback(async () => {
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
  }, [user, showNotification]);

  // Fetch Assignments
  const fetchAssignments = useCallback(async () => {
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
  }, [user, showNotification]);

  // Fetch Timetable
  const fetchTimetable = useCallback(async () => {
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
  }, [showNotification]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
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
  }, [showNotification]);

  // Fetch Library
  const fetchLibrary = useCallback(async () => {
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
  }, [showNotification]);

  // Fetch Leave Requests
  const fetchLeaveRequests = useCallback(async () => {
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
  }, [showNotification]);

  // Submit leave request
  const handleLeaveSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Frontend validation for dates
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(leaveFormData.startDate);
    const end = new Date(leaveFormData.endDate);

    if (!leaveFormData.startDate || !leaveFormData.endDate) {
      showNotification('Please select both start and end dates', 'error');
      return;
    }
    if (start < today) {
      showNotification('Start date cannot be in the past', 'error');
      return;
    }
    if (end < start) {
      showNotification('End date cannot be before start date', 'error');
      return;
    }
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
  }, [leaveFormData, showNotification, fetchLeaveRequests]);

  // Use imported module configuration

  const renderMainContent = () => {
    switch (activeModule) {
      case 'home':
        return <StudentHome 
          user={user} 
          stats={stats} 
          loading={loading} 
          error={error} 
          fetchDashboardData={fetchDashboardData}
          setActiveModule={setActiveModule}
        />;
      
      case 'courses':
        return <StudentCourses 
          courses={courses} 
          coursesLoading={coursesLoading}
          openCourseDetails={openCourseDetails}
        />;
      
      case 'assignments':
        return <StudentAssignments 
          assignments={assignments}
          assignmentsLoading={assignmentsLoading}
          showNotification={showNotification}
        />;

      case 'fees':
        return <StudentFees 
          fees={fees}
          feesLoading={feesLoading}
          payments={payments}
          feeSummary={feeSummary}
          showPaymentForm={showPaymentForm}
          setShowPaymentForm={setShowPaymentForm}
          selectedFee={selectedFee}
          setSelectedFee={setSelectedFee}
          paymentFormData={paymentFormData}
          setPaymentFormData={setPaymentFormData}
          handlePaymentSubmit={handlePaymentSubmit}
          handleDownloadReceipt={handleDownloadReceipt}
        />;

      case 'grades':
        return <StudentGrades 
          grades={grades}
          gradesLoading={gradesLoading}
        />;

      case 'attendance':
        return <StudentAttendance 
          attendance={attendance}
          attendanceLoading={attendanceLoading}
        />;

      case 'timetable':
        return <StudentTimetable 
          timetable={timetable}
          timetableLoading={timetableLoading}
        />;

      case 'announcements':
        return <StudentAnnouncements 
          announcements={announcements}
          announcementsLoading={announcementsLoading}
        />;

      case 'messages':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
              <p className="text-slate-600">Chat with your teachers</p>
            </div>
            <StudentInbox user={user} socket={socketRef.current} />
          </div>
        );

      case 'library':
        return <StudentLibrary 
          library={library}
          libraryLoading={libraryLoading}
        />;

      case 'leave':
        return <StudentLeave 
          leaveRequests={leaveRequests}
          leaveRequestsLoading={leaveRequestsLoading}
          showLeaveForm={showLeaveForm}
          setShowLeaveForm={setShowLeaveForm}
          leaveFormData={leaveFormData}
          setLeaveFormData={setLeaveFormData}
          handleLeaveSubmit={handleLeaveSubmit}
          leaveCurrentPage={leaveCurrentPage}
          setLeaveCurrentPage={setLeaveCurrentPage}
          leaveRequestsPerPage={leaveRequestsPerPage}
        />;

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {STUDENT_MODULES.find(m => m.id === activeModule)?.icon && 
                React.createElement(STUDENT_MODULES.find(m => m.id === activeModule).icon, {
                  className: "w-8 h-8 text-blue-600"
                })
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {STUDENT_MODULES.find(m => m.id === activeModule)?.title}
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
      <NotificationToast notification={notification} onClose={hideNotification} />

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 min-h-screen overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {STUDENT_MODULES.map((module) => (
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
              {STUDENT_MODULES.find(m => m.id === activeModule)?.title || 'Dashboard'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal 
        showCourseModal={showCourseModal}
        setShowCourseModal={setShowCourseModal}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        courseDetails={courseDetails}
        setCourseDetails={setCourseDetails}
        courseDetailsLoading={courseDetailsLoading}
        fetchCourseDetails={fetchCourseDetails}
      />

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
