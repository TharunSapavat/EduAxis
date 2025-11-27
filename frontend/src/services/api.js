import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Send cookies with requests
});

// Request interceptor - Cookies are sent automatically
api.interceptors.request.use(
  (config) => {
    // No need to manually add token - cookies are sent automatically!
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear user session (cookie is cleared by backend)
          console.error('Unauthorized access - logging out');
          localStorage.removeItem('user');
          window.location.href = '/';
          break;
        case 403:
          console.error('Forbidden:', data.message);
          break;
        case 404:
          console.error('Resource not found:', data.message);
          break;
        case 500:
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API error:', data.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - server not responding');
      error.message = 'Cannot connect to server. Please check your connection.';
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: (userId) => api.get('/auth/me', { params: { userId } }),
};

// Student APIs
export const studentAPI = {
  getDashboard: (studentId) => api.get(`/student/dashboard?studentId=${studentId}`),
  getCourses: () => api.get('/student/courses'),
  getCourseDetails: (courseId) => api.get(`/student/courses/${courseId}`),
  getGrades: (studentId) => api.get(`/student/grades?studentId=${studentId}`),
  getAttendance: (studentId) => api.get(`/student/attendance?studentId=${studentId}`),
  getAssignments: (studentId) => api.get(`/student/assignments?studentId=${studentId}`),
  submitAssignment: (data) => api.post('/student/assignments/submit', data),
  getSubmissionDetails: (assignmentId) => api.get(`/student/assignments/${assignmentId}/submission`),
  getTimetable: (day) => api.get('/student/timetable', { params: { day } }),
  getAnnouncements: () => api.get('/student/announcements'),
  getFees: () => api.get('/student/fees'),
  makePayment: (paymentData) => api.post('/student/payment', paymentData),
  downloadReceipt: (paymentId) => api.get(`/student/receipt/${paymentId}`),
  getLibrary: () => api.get('/student/library'),
};

// Teacher APIs
export const teacherAPI = {
  getDashboard: (teacherId) => api.get(`/teacher/dashboard?teacherId=${teacherId}`),
  getCourses: (teacherId) => api.get(`/teacher/courses?teacherId=${teacherId}`),
  getStudents: (params) => api.get('/teacher/students', { params }),
  markAttendance: (data) => api.post('/teacher/attendance', data),
  submitGrades: (data) => api.post('/teacher/grades', data),
  getAssignments: () => api.get('/teacher/assignments'),
  createAssignment: (formData) => {
    // Handle both FormData (with files) and regular JSON
    const config = formData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/teacher/assignments', formData, config);
  },
  getAnnouncements: () => api.get('/teacher/announcements'),
  postAnnouncement: (data) => api.post('/teacher/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/teacher/announcements/${id}`),
  applyLeave: (data) => api.post('/teacher/leave', data),
  getLeaveApplications: () => api.get('/teacher/leave'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCourses: () => api.get('/admin/courses'),
  createCourse: (courseData) => api.post('/admin/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/admin/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getClasses: () => api.get('/admin/classes'),
  getReports: () => api.get('/admin/reports'),
  
  // Fee Management
  getFees: () => api.get('/admin/fees'),
  createFee: (feeData) => api.post('/admin/fees', feeData),
  updateFee: (id, feeData) => api.put(`/admin/fees/${id}`, feeData),
  deleteFee: (id) => api.delete(`/admin/fees/${id}`),
  
  // Payment Management
  getPayments: (params) => api.get('/admin/payments', { params }),
  createPayment: (paymentData) => api.post('/admin/payments', paymentData),
  getPaymentStats: () => api.get('/admin/payments/stats'),
  exportPayments: (params) => api.get('/admin/payments/export', { params }),
  sendFeeReminders: (feeId) => api.post('/admin/fees/reminders', { feeId }),
  
  // Class Management
  getClassOverview: () => api.get('/admin/class/overview'),
  getStudentAnalytics: (params) => api.get('/admin/class/students', { params }),
  getAtRiskStudents: () => api.get('/admin/class/at-risk'),
  getStudentDetails: (id) => api.get(`/admin/class/students/${id}`),
  
  // Leave Management
  getLeaveApplications: (params) => api.get('/admin/leave', { params }),
  reviewLeaveApplication: (id, data) => api.put(`/admin/leave/${id}`, data),
};

export default api;
