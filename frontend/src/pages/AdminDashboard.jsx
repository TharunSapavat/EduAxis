import { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, FileText, BarChart3, Settings, Shield, Database, DollarSign, Library, GraduationCap, ClipboardList, Home, X, Search, Filter, Eye, Mail, Phone, MapPin, Trash2, UserPlus, Lock, CalendarCheck, Check, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import ClassManagement from '../components/ClassManagement.jsx';

// User creation validation schema
const userSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .test('no-leading-trailing-spaces', 'Name cannot start or end with spaces', 
      value => value ? value.trim() === value : true),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .test('no-spaces', 'Email cannot contain spaces', value => value ? !value.includes(' ') : true),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .length(10, 'Phone number must be exactly 10 digits'),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/, 'Date must be in DD-MM-YYYY format')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    })
    .test('age', 'User must be at least 5 years old', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 5;
      }
      return age >= 5;
    })
    .test('max-age', 'Please enter a valid date of birth', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      return birthDate <= today;
    }),
  role: yup
    .string()
    .oneOf(['student', 'teacher', 'admin'], 'Please select a valid role')
    .required('Role is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(50, 'Password must not exceed 50 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  grade: yup
    .string()
    .when('role', {
      is: 'student',
      then: (schema) => schema
        .required('Grade is required for students')
        .matches(/^(1|2|3|4|5|6|7|8|9|10|11|12)$/, 'Please select a valid grade'),
      otherwise: (schema) => schema.notRequired()
    }),
  section: yup
    .string()
    .matches(/^[A-D]?$/, 'Section must be A, B, C, or D')
    .notRequired()
}).required();

// Course validation schema
const courseSchema = yup.object({
  name: yup
    .string()
    .required('Course name is required')
    .min(2, 'Course name must be at least 2 characters')
    .max(100, 'Course name must not exceed 100 characters')
    .trim(),
  code: yup
    .string()
    .required('Course code is required')
    .min(3, 'Course code must be at least 3 characters')
    .max(10, 'Course code must not exceed 10 characters')
    .matches(/^[A-Z0-9-]+$/, 'Course code must be uppercase letters, numbers, or hyphens')
    .trim(),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .notRequired(),
  teacher: yup
    .string()
    .max(100, 'Teacher name must not exceed 100 characters')
    .notRequired(),
  credits: yup
    .number()
    .required('Credits are required')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6')
    .integer('Credits must be a whole number'),
  grade: yup
    .number()
    .required('Grade is required')
    .min(1, 'Grade must be at least 1')
    .max(12, 'Grade cannot exceed 12')
    .integer('Grade must be a whole number'),
  status: yup
    .string()
    .oneOf(['active', 'inactive', 'archived'], 'Invalid status')
    .required('Status is required')
}).required();

// Fee form validation schema
const feeSchema = yup.object({
  title: yup
    .string()
    .required('Fee title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,]+$/, 'Title can only contain letters, numbers, spaces, and basic punctuation')
    .test('no-leading-trailing-spaces', 'Title cannot start or end with spaces', 
      value => value ? value.trim() === value : true),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be a positive number')
    .min(1, 'Amount must be at least 1')
    .max(1000000, 'Amount must not exceed 1,000,000')
    .typeError('Amount must be a valid number'),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .notRequired(),
  dueDate: yup
    .string()
    .required('Due date is required')
    .test('future-date', 'Due date must be today or in the future', function(value) {
      if (!value) return false;
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }),
  semester: yup
    .string()
    .oneOf(['Annual', 'Fall', 'Spring', 'Summer'], 'Please select a valid semester')
    .required('Semester is required'),
  appliesTo: yup
    .string()
    .oneOf(['all', 'grade-specific'], 'Invalid option')
    .required('Please specify who this fee applies to'),
  grades: yup
    .array()
    .of(yup.string().matches(/^(1|2|3|4|5|6|7|8|9|10|11|12)$/, 'Invalid grade'))
    .when('appliesTo', {
      is: 'grade-specific',
      then: (schema) => schema.min(1, 'Select at least one grade'),
      otherwise: (schema) => schema.notRequired()
    })
}).required();

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
  const [showUserForm, setShowUserForm] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  // User form with React Hook Form
  const {
    register: registerUser,
    handleSubmit: handleUserFormSubmit,
    watch: watchUser,
    setValue: setUserValue,
    reset: resetUserForm,
    formState: { errors: userErrors }
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      dateOfBirth: '',
      grade: '',
      section: ''
    }
  });

  const currentUserRole = watchUser('role');

  // Fee Management States
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [feesLoading, setFeesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ total: 0, completed: 0, totalAmount: 0 });

  // Course Management States
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Fee form with React Hook Form
  const {
    register: registerFee,
    handleSubmit: handleFeeFormSubmit,
    watch: watchFee,
    setValue: setFeeValue,
    reset: resetFeeForm,
    formState: { errors: feeErrors }
  } = useForm({
    resolver: yupResolver(feeSchema),
    defaultValues: {
      title: '',
      amount: '',
      description: '',
      dueDate: '',
      semester: 'Annual',
      appliesTo: 'all',
      grades: []
    }
  });

  const feeAppliesTo = watchFee('appliesTo');
  const feeGrades = watchFee('grades');

  // Course form with React Hook Form
  const {
    register: registerCourse,
    handleSubmit: handleCourseFormSubmit,
    reset: resetCourseForm,
    setValue: setCourseValue,
    formState: { errors: courseErrors }
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      teacher: '',
      teacherId: '',
      credits: 3,
      grade: 1,
      status: 'active'
    }
  });

  // Fetch users function (defined here so handleCreateUser can use it)
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

  // Fetch users from API on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch fees and payments when fees module is active
  useEffect(() => {
    if (activeModule === 'fees') {
      fetchFees();
      fetchPayments();
    }
  }, [activeModule]);

  // Fetch courses when courses module is active
  useEffect(() => {
    if (activeModule === 'courses') {
      fetchCourses();
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

  const handleCreateFee = async (data) => {
    try {
      const res = await adminAPI.createFee(data);
      if (res.data.success) {
        setShowFeeForm(false);
        resetFeeForm();
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

  const handleCreateUser = async (data) => {
    try {
      setUsersLoading(true);
      
      console.log('Form data received:', JSON.stringify(data, null, 2)); // Debug log
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for backend
      const dateOfBirthFormatted = data.dateOfBirth
        ? data.dateOfBirth.split('-').reverse().join('-')
        : undefined;
      
      // Build user data based on role
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        dateOfBirth: dateOfBirthFormatted
      };
      
      // Only include grade and section for students
      if (data.role === 'student') {
        userData.grade = data.grade || undefined;
        userData.section = data.section || undefined;
      }
      
      console.log('Sending to backend:', JSON.stringify(userData, null, 2)); // Debug log
      
      const response = await adminAPI.createUser(userData);
      
      if (response.data.success) {
        setShowUserForm(false);
        resetUserForm();
        fetchUsers();
        alert('User created successfully!');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setUsersLoading(true);
      const response = await adminAPI.deleteUser(userId);
      
      if (response.data.success) {
        setShowUserDetails(false);
        setSelectedUser(null);
        fetchUsers();
        alert('User deleted successfully!');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUsersLoading(false);
    }
  };

  // Course Management Functions
  const fetchCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const res = await adminAPI.getCourses();
      const coursesData = res.data?.courses || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCoursesError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCreateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      // Attach teacher name when teacherId is provided
      const payload = { ...data };
      if (data.teacherId) {
        const teacher = users.find(u => u.id === data.teacherId);
        payload.teacher = teacher ? teacher.name : '';
      }

      const response = await adminAPI.createCourse(payload);
      
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        resetCourseForm();
        fetchCourses();
        alert('Course created successfully!');
      }
    } catch (err) {
      console.error('Failed to create course:', err);
      alert(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleUpdateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      const payload = { ...data };
      if (data.teacherId) {
        const teacher = users.find(u => u.id === data.teacherId);
        payload.teacher = teacher ? teacher.name : '';
      }

      const response = await adminAPI.updateCourse(selectedCourse._id, payload);
      
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        setSelectedCourse(null);
        resetCourseForm();
        fetchCourses();
        alert('Course updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update course:', err);
      alert(err.response?.data?.message || 'Failed to update course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setCoursesLoading(true);
      const response = await adminAPI.deleteCourse(courseId);
      
      if (response.data.success) {
        setShowCourseDetails(false);
        setSelectedCourse(null);
        fetchCourses();
        alert('Course deleted successfully!');
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setIsEditMode(true);
    setCourseValue('name', course.name);
    setCourseValue('code', course.code);
    setCourseValue('description', course.description || '');
  setCourseValue('teacher', course.teacher || '');
  setCourseValue('teacherId', course.teacherId || '');
    setCourseValue('credits', course.credits);
    setCourseValue('grade', course.grade);
    setCourseValue('status', course.status);
    setShowCourseForm(true);
  };

  const handleViewCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  // Filter courses
  useEffect(() => {
    let result = courses;

    // Filter by status
    if (courseStatusFilter !== 'all') {
      result = result.filter(c => c.status === courseStatusFilter);
    }

    // Search by name or code
    if (courseSearchQuery.trim()) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        (c.teacher && c.teacher.toLowerCase().includes(courseSearchQuery.toLowerCase()))
      );
    }

    setFilteredCourses(result);
  }, [courseSearchQuery, courseStatusFilter, courses]);

  const modules = [
    { id: 'home', icon: Home, title: 'Home', description: 'Overview and statistics' },
    { id: 'users', icon: Users, title: 'User Management', description: 'Manage students, teachers & staff' },
    { id: 'courses', icon: BookOpen, title: 'Course Management', description: 'Create and manage courses' },
    { id: 'timetable', icon: Calendar, title: 'Timetable', description: 'Schedule classes and events' },
    { id: 'attendance', icon: ClipboardList, title: 'Attendance', description: 'View all attendance data' },
    { id: 'fees', icon: DollarSign, title: 'Fee Management', description: 'Manage fee structure & payments' },
    { id: 'leave', icon: CalendarCheck, title: 'Leave Management', description: 'Approve/reject leave requests' },
    { id: 'classes', icon: GraduationCap, title: 'Class Management', description: 'Manage classes and sections' },
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
                    <p className="text-3xl font-bold text-purple-600 mt-1">₹485K</p>
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
                <button 
                  onClick={() => setShowUserForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
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
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleViewDetails(user)}
                                className="text-purple-600 hover:text-purple-900 font-medium flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 font-medium flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
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
                        <button 
                          onClick={() => handleDeleteUser(selectedUser.id)}
                          className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      resetUserForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">Add New User</h2>
                      <p className="text-slate-600 mt-2">Create a new account for student, teacher, or admin</p>
                    </div>

                    <form onSubmit={handleUserFormSubmit(handleCreateUser)} className="space-y-5">
                      {/* Role Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          User Role
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['student', 'teacher', 'admin'].map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setUserValue('role', role)}
                              className={`py-2 px-4 rounded-lg font-medium transition-all ${
                                currentUserRole === role
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                          ))}
                        </div>
                        {userErrors.role && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.role.message}</p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          {...registerUser('name')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.name ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="John Doe"
                        />
                        {userErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.name.message}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                          type="text"
                          {...registerUser('email')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.email ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="user@example.com"
                          autoComplete="email"
                        />
                        {userErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.email.message}</p>
                        )}
                      </div>

                      {/* Phone and DOB in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                          <input
                            type="text"
                            {...registerUser('phone')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              userErrors.phone ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="1234567890"
                            maxLength={10}
                          />
                          {userErrors.phone && (
                            <p className="mt-1 text-sm text-red-600">{userErrors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth (DD-MM-YYYY)</label>
                          <input
                            type="text"
                            {...registerUser('dateOfBirth')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              userErrors.dateOfBirth ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="DD-MM-YYYY"
                            maxLength={10}
                          />
                          {userErrors.dateOfBirth && (
                            <p className="mt-1 text-sm text-red-600">{userErrors.dateOfBirth.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Student-specific fields */}
                      {currentUserRole === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                            <select
                              {...registerUser('grade')}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                                userErrors.grade ? 'border-red-500' : 'border-slate-300'
                              }`}
                            >
                              <option value="">Select grade</option>
                              {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={String(i+1)}>{i+1}</option>
                              ))}
                            </select>
                            {userErrors.grade && (
                              <p className="mt-1 text-sm text-red-600">{userErrors.grade.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Section (optional)</label>
                            <select
                              {...registerUser('section')}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                            >
                              <option value="">Select section</option>
                              {['A','B','C','D'].map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                          type="password"
                          {...registerUser('password')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.password ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Create a strong password"
                        />
                        {userErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.password.message}</p>
                        )}
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserForm(false);
                            resetUserForm();
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={usersLoading}
                          className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {usersLoading ? 'Creating User...' : 'Create User'}
                        </button>
                      </div>
                    </form>
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
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowFeeForm(false);
                      resetFeeForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Set New Fee</h2>
                    <form onSubmit={handleFeeFormSubmit(handleCreateFee)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fee Title</label>
                        <input
                          type="text"
                          {...registerFee('title')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.title ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="e.g., Tuition Fee - Fall 2025"
                        />
                        {feeErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.title.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...registerFee('amount')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.amount ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="5000"
                        />
                        {feeErrors.amount && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.amount.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                          {...registerFee('description')}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows="3"
                          placeholder="Optional description"
                        />
                        {feeErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.description.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          {...registerFee('dueDate')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.dueDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {feeErrors.dueDate && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.dueDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                        <select
                          {...registerFee('semester')}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Annual">Annual</option>
                          <option value="Fall">Fall</option>
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                        </select>
                        {feeErrors.semester && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.semester.message}</p>
                        )}
                      </div>

                      {/* Applies To: All vs Grade-specific */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Applies To</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFeeValue('appliesTo', 'all');
                              setFeeValue('grades', []);
                            }}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeAppliesTo === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            All Students
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeeValue('appliesTo', 'grade-specific')}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeAppliesTo === 'grade-specific' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            Specific Grades
                          </button>
                        </div>
                        {feeErrors.appliesTo && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.appliesTo.message}</p>
                        )}
                      </div>

                      {/* Grade multi-select when grade-specific */}
                      {feeAppliesTo === 'grade-specific' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Grades</label>
                          <div className="grid grid-cols-6 gap-2">
                            {[...Array(12)].map((_, i) => {
                              const g = String(i + 1);
                              const selected = feeGrades.includes(g);
                              return (
                                <button
                                  type="button"
                                  key={g}
                                  onClick={() => {
                                    const grades = selected
                                      ? feeGrades.filter(x => x !== g)
                                      : [...feeGrades, g];
                                    setFeeValue('grades', grades);
                                  }}
                                  className={`text-sm py-2 rounded border ${selected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                  {g}
                                </button>
                              );
                            })}
                          </div>
                          {feeErrors.grades && (
                            <p className="mt-1 text-sm text-red-600">{feeErrors.grades.message}</p>
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
          <div>
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                  <p className="text-slate-600 mt-1">Create and manage all courses in the system</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setSelectedCourse(null);
                    resetCourseForm();
                    setShowCourseForm(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Add New Course</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Total Courses</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{courses.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Active Courses</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {courses.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-orange-600 text-sm font-medium">Inactive Courses</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {courses.filter(c => c.status === 'inactive').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-purple-600 text-sm font-medium">Archived Courses</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {courses.filter(c => c.status === 'archived').length}
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
                    placeholder="Search by course name, code, or teacher..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesLoading ? (
                <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-slate-500">Loading courses...</p>
                </div>
              ) : coursesError ? (
                <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-red-600">{coursesError}</p>
                </div>
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100"
                  >
                    <div className="p-6">
                      {/* Course Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{course.name}</h3>
                          <p className="text-sm font-medium text-purple-600">{course.code}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'active' ? 'bg-green-100 text-green-700' :
                          course.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {course.status}
                        </span>
                      </div>

                      {/* Course Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Users className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Teacher: {course.teacher || 'TBD'}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Credits: {course.credits}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Grade: {course.grade}</span>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleViewCourseDetails(course)}
                          className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No courses found</p>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedCourse(null);
                      resetCourseForm();
                      setShowCourseForm(true);
                    }}
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Add Your First Course</span>
                  </button>
                </div>
              )}
            </div>

            {/* Course Form Modal */}
            {showCourseForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowCourseForm(false);
                      setIsEditMode(false);
                      setSelectedCourse(null);
                      resetCourseForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {isEditMode ? 'Edit Course' : 'Add New Course'}
                      </h2>
                      <p className="text-slate-600 mt-2">
                        {isEditMode ? 'Update course information' : 'Create a new course'}
                      </p>
                    </div>

                    <form
                      onSubmit={handleCourseFormSubmit(isEditMode ? handleUpdateCourse : handleCreateCourse)}
                      className="space-y-5"
                    >
                      {/* Course Name and Code */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Course Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerCourse('name')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              courseErrors.name ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="e.g., Introduction to Computer Science"
                          />
                          {courseErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Course Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerCourse('code')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase ${
                              courseErrors.code ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="e.g., CS-101"
                            maxLength={10}
                            disabled={isEditMode}
                          />
                          {courseErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.code.message}</p>
                          )}
                          {isEditMode && (
                            <p className="mt-1 text-xs text-slate-500">Course code cannot be changed</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                          {...registerCourse('description')}
                          rows={3}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            courseErrors.description ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Brief description of the course..."
                          maxLength={500}
                        />
                        {courseErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.description.message}</p>
                        )}
                      </div>

                      {/* Teacher Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Assign Teacher
                        </label>
                        <select
                          {...registerCourse('teacherId')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                            courseErrors.teacher ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          <option value="">Select a teacher (optional)</option>
                          {users
                            .filter(u => u.role === 'teacher')
                            .map(teacher => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name} - {teacher.email}
                              </option>
                            ))}
                        </select>
                        {courseErrors.teacher && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.teacher.message}</p>
                        )}
                        {users.filter(u => u.role === 'teacher').length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">No teachers available. Add teachers first.</p>
                        )}
                      </div>

                      {/* Credits, Semester, Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Credits <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            {...registerCourse('credits')}
                            min={1}
                            max={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              courseErrors.credits ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          {courseErrors.credits && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.credits.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Grade <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...registerCourse('grade')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                              courseErrors.grade ? 'border-red-500' : 'border-slate-300'
                            }`}
                          >
                            <option value="">Select grade</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                          </select>
                          {courseErrors.grade && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.grade.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Status <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...registerCourse('status')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                              courseErrors.status ? 'border-red-500' : 'border-slate-300'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                          </select>
                          {courseErrors.status && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.status.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCourseForm(false);
                            setIsEditMode(false);
                            setSelectedCourse(null);
                            resetCourseForm();
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={coursesLoading}
                          className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {coursesLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Course' : 'Create Course')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Course Details Modal */}
            {showCourseDetails && selectedCourse && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowCourseDetails(false);
                      setSelectedCourse(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-10 h-10 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
                      <p className="text-purple-600 font-semibold mt-2">{selectedCourse.code}</p>
                      <div className="flex items-center justify-center mt-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedCourse.status === 'active' ? 'bg-green-100 text-green-700' :
                          selectedCourse.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedCourse.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Teacher</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.teacher || 'TBD'}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Credits</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.credits}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <GraduationCap className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.grade}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Students Enrolled</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.students || 0}</p>
                          </div>
                        </div>
                      </div>

                      {selectedCourse.description && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 uppercase font-medium mb-2">Description</p>
                          <p className="text-sm text-slate-700">{selectedCourse.description}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-6 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setShowCourseDetails(false);
                            handleEditCourse(selectedCourse);
                          }}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Edit Course
                        </button>
                        <button
                          onClick={() => {
                            setShowCourseDetails(false);
                            handleDeleteCourse(selectedCourse._id);
                          }}
                          className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'classes':
        return <ClassManagement />;

      case 'leave':
        return <LeaveManagement />;

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

// Leave Management Component
function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getLeaveApplications({ 
        status: 'all',
        role: roleFilter 
      });
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Failed to load leave applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [roleFilter]);

  const handleReview = async (id, status, comment = '') => {
    if (!confirm(`Are you sure you want to ${status} this leave application?`)) return;

    try {
      setProcessing(id);
      await adminAPI.reviewLeaveApplication(id, { status, comment });
      await loadLeaves();
    } catch (error) {
      console.error('Failed to review leave:', error);
      alert('Failed to review leave application');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  // Filter leaves for display based on status filter and search query
  let filteredLeaves = statusFilter === 'all' 
    ? leaves 
    : leaves.filter(l => l.status === statusFilter);

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredLeaves = filteredLeaves.filter(leave => 
      leave.applicant?.name?.toLowerCase().includes(query) ||
      leave.applicant?.email?.toLowerCase().includes(query) ||
      leave.leaveType?.toLowerCase().includes(query) ||
      leave.reason?.toLowerCase().includes(query)
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Leave Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
        >
          <h3 className="text-sm font-medium text-slate-600 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
        </div>
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
        >
          <h3 className="text-sm font-medium text-slate-600 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
        </div>
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
        >
          <h3 className="text-sm font-medium text-slate-600 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, type, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-slate-600 mt-4">Loading leave applications...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No leave applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeaves.map((leave) => (
              <div key={leave._id} className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {leave.applicant?.name || 'Unknown'}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase font-medium">
                        {leave.applicantRole}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(leave.status)}`}>
                        {leave.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{leave.applicant?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Leave Type</p>
                    <p className="text-sm text-slate-600 capitalize">{leave.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Duration</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-1">Reason</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{leave.reason}</p>
                </div>

                {leave.reviewComment && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Admin Comment</p>
                    <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded">{leave.reviewComment}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>Applied: {formatDate(leave.createdAt)}</span>
                  {leave.reviewedAt && (
                    <span>
                      Reviewed by {leave.reviewedBy?.name} on {formatDate(leave.reviewedAt)}
                    </span>
                  )}
                </div>

                {leave.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleReview(leave._id, 'approved')}
                      disabled={processing === leave._id}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {processing === leave._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const comment = prompt('Optional: Add a comment for rejection');
                        if (comment !== null) handleReview(leave._id, 'rejected', comment);
                      }}
                      disabled={processing === leave._id}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {processing === leave._id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
