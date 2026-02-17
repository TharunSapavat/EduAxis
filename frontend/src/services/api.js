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

let isRedirectingUnauthorized = false;

// CSRF DISABLED - Causing too many issues with delete/send operations

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - Only redirect if it's NOT a login/register request
          const isAuthRequest = error.config.url.includes('/auth/login') || 
                                error.config.url.includes('/auth/register');
          
          if (!isAuthRequest && !isRedirectingUnauthorized) {
            isRedirectingUnauthorized = true;
            // User is not authenticated for a protected route - clear session
            console.error('Unauthorized access - logging out');
            localStorage.removeItem('user');
            localStorage.removeItem('persist:root');
            window.location.href = '/';
          }
          // For auth requests (login/register), let the component handle the error
          break;
          
        case 403:
          console.error('Forbidden:', data.message);
          break;
          
        case 429:
          console.error('Too many requests - rate limited. Please wait a moment and try again.');
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
      // Request made but no response
      console.error('No response from server. Please check your connection.');
    } else {
      // Something else happened
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
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Student APIs
export const studentAPI = {
  getDashboard: (studentId) => api.get(`/student/dashboard?studentId=${studentId}`),
  getCourses: () => api.get('/student/courses'),
  getCourseDetails: (courseId) => api.get(`/student/courses/${courseId}`),
  getGrades: (studentId) => api.get(`/student/grades?studentId=${studentId}`),
  getAttendance: (studentId) => api.get(`/student/attendance?studentId=${studentId}`),
  getAssignments: (studentId) => api.get(`/student/assignments?studentId=${studentId}`),
  submitAssignment: (data) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/student/assignments/submit', data, config);
  },
  getSubmissionDetails: (assignmentId) => api.get(`/student/assignments/${assignmentId}/submission`),
  getTimetable: (day) => api.get('/student/timetable', { params: { day } }),
  getSchedule: () => api.get('/student/schedule'),
  getAnnouncements: () => api.get('/student/announcements'),
  markAnnouncementAsRead: (id) => api.patch(`/student/announcements/${id}/read`),
  hideAnnouncement: (id) => api.delete(`/student/announcements/${id}`),
  clearAllAnnouncements: () => api.delete('/student/announcements'),
  getFees: () => api.get('/student/fees'),
  makePayment: (paymentData) => api.post('/student/payment', paymentData),
  downloadReceipt: (paymentId) => api.get(`/student/receipt/${paymentId}`),
  getLibrary: (params) => api.get('/student/library', { params }),
  // Messaging
  sendMessage: (data) => api.post('/messages', data),
  // Leave Requests
  createLeaveRequest: (data) => api.post('/student/leave-requests', data),
  getLeaveRequests: () => api.get('/student/leave-requests'),
  // Study Materials
  getStudyMaterials: () => api.get('/student/study-materials'),
};

// Teacher APIs
export const teacherAPI = {
  getDashboard: (teacherId) => api.get(`/teacher/dashboard?teacherId=${teacherId}`),
  getCourses: (teacherId) => api.get(`/teacher/courses?teacherId=${teacherId}`),
  getStudents: (params) => api.get('/teacher/students', { params }),
  markAttendance: (data) => api.post('/teacher/attendance', data),
  getAttendance: (params) => api.get('/teacher/attendance', { params }),
  submitGrades: (data) => api.post('/teacher/grades', data),
  getAssignments: () => api.get('/teacher/assignments'),
  createAssignment: (formData) => {
    // Handle both FormData (with files) and regular JSON
    const config = formData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/teacher/assignments', formData, config);
  },
  getSubmissions: (assignmentId) => api.get(`/teacher/assignments/${assignmentId}/submissions`),
  getAnnouncements: () => api.get('/teacher/announcements'),
  postAnnouncement: (data) => api.post('/teacher/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/teacher/announcements/${id}`),
  // Timetable
  getTimetable: () => api.get('/teacher/timetable'),
  // Weekly schedule
  getSchedule: (params) => api.get('/teacher/schedule', { params }),
  createSchedule: (data) => api.post('/teacher/schedule', data),
  deleteSchedule: (id) => api.delete(`/teacher/schedule/${id}`),
  // Leave Requests
  applyLeave: (data) => api.post('/teacher/leave-requests', data),
  getLeaveRequests: () => api.get('/teacher/leave-requests'),
  // Study Materials
  uploadStudyMaterial: (formData) => api.post('/teacher/study-materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStudyMaterials: () => api.get('/teacher/study-materials'),
  deleteStudyMaterial: (id) => api.delete(`/teacher/study-materials/${id}`),
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
  // Library management
  getLibraryResources: () => api.get('/admin/library'),
  createLibraryResource: (data) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/admin/library', data, config);
  },
  deleteLibraryResource: (id) => api.delete(`/admin/library/${id}`),
  exportPayments: (params) => api.get('/admin/payments/export', { params }),
  sendFeeReminders: (feeId) => api.post('/admin/fees/reminders', { feeId }),
  // Class Management
  getClassOverview: () => api.get('/admin/class/overview'),
  getStudentAnalytics: (params) => api.get('/admin/class/students', { params }),
  getAtRiskStudents: () => api.get('/admin/class/at-risk'),
  getStudentDetails: (id) => api.get(`/admin/class/students/${id}`),
  // Leave Requests
  getLeaveRequests: (params) => api.get('/admin/leave-requests', { params }),
  decideLeaveRequest: (id, action, remarks) => api.patch(`/admin/leave-requests/${id}`, { action, remarks }),
  // Timetables
  getTimetables: (params) => api.get('/admin/timetables', { params }),
  saveTimetable: (data) => api.post('/admin/timetables', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTimetable: (id, updates) => api.patch(`/admin/timetables/${id}`, updates),
  deleteTimetable: (id) => api.delete(`/admin/timetables/${id}`)
};

// Super Admin APIs
export const superAdminAPI = {
  getDashboard: () => api.get('/superadmin/dashboard'),
  getStatistics: () => api.get('/superadmin/statistics'),
  
  // School Management
  getAllSchools: (params) => api.get('/superadmin/schools', { params }),
  getSchoolById: (id) => api.get(`/superadmin/schools/${id}`),
  createSchool: (schoolData) => api.post('/superadmin/schools', schoolData),
  updateSchool: (id, schoolData) => api.put(`/superadmin/schools/${id}`, schoolData),
  deleteSchool: (id) => api.delete(`/superadmin/schools/${id}`),
  
  // School Status Management
  updateSchoolStatus: (id, status) => api.patch(`/superadmin/schools/${id}/status`, { status }),
  
  // Subscription Management
  updateSchoolSubscription: (id, subscriptionData) => 
    api.patch(`/superadmin/schools/${id}/subscription`, subscriptionData),
};

export default api;
