import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Add user ID or token to headers (for future JWT implementation)
        config.headers['X-User-ID'] = userData._id || userData.id;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
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
          // Unauthorized - clear user session
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
  getGrades: () => api.get('/student/grades'),
  getAttendance: () => api.get('/student/attendance'),
  getAssignments: (studentId) => api.get(`/student/assignments?studentId=${studentId}`),
  getTimetable: () => api.get('/student/timetable'),
  getAnnouncements: () => api.get('/student/announcements'),
  getFees: () => api.get('/student/fees'),
};

// Teacher APIs
export const teacherAPI = {
  getDashboard: (teacherId) => api.get(`/teacher/dashboard?teacherId=${teacherId}`),
  getCourses: (teacherId) => api.get(`/teacher/courses?teacherId=${teacherId}`),
  getStudents: () => api.get('/teacher/students'),
  markAttendance: (data) => api.post('/teacher/attendance', data),
  submitGrades: (data) => api.post('/teacher/grades', data),
  getAssignments: () => api.get('/teacher/assignments'),
  postAnnouncement: (data) => api.post('/teacher/announcements', data),
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
  getClasses: () => api.get('/admin/classes'),
  getReports: () => api.get('/admin/reports'),
};

export default api;
