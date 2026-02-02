# EduAxis - Project Wireframe & Architecture

## Project Overview
EduAxis is a comprehensive School Management System that provides integrated solutions for students, teachers, and administrators to manage academic activities, assignments, grades, attendance, fees, and communications.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React)                       │
│  ┌──────────────────┬──────────────────┬──────────────────┐     │
│  │  Student Portal  │  Teacher Portal  │  Admin Panel     │     │
│  └──────────────────┴──────────────────┴──────────────────┘     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                     STATE MANAGEMENT (Redux)                      │
│              [Actions | Reducers | Selectors]                    │
├─────────────────────────────────────────────────────────────────┤
│                   API COMMUNICATION LAYER                         │
│                      [Axios HTTP Client]                         │
├─────────────────────────────────────────────────────────────────┤
│                        API SERVER (Express)                       │
│  ┌──────────────────┬──────────────────┬──────────────────┐     │
│  │  Auth Routes     │  Business Logic   │  Data Access     │     │
│  │  Controllers     │  Middleware       │  Models          │     │
│  └──────────────────┴──────────────────┴──────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER (MongoDB)                       │
│           [Users | Courses | Assignments | Grades...]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Page Structure (5 Main Pages)

```
Frontend/
├── LandingPage.jsx (Public - Entry point)
├── Login.jsx (Authentication)
├── Register.jsx (User Registration)
└── Dashboard Pages (Role-based)
    ├── StudentDashboard.jsx
    ├── TeacherDashboard.jsx
    └── AdminDashboard.jsx
```

### 2.2 Component Hierarchy

```
App.jsx
├── AuthContext (Global Authentication State)
├── SocketContext (Real-time Messaging)
├── Routes
│   ├── LandingPage
│   │   └── Navbar, Hero Section, Features
│   │
│   ├── Login/Register
│   │   └── DashboardHeader (Top Navigation)
│   │
│   ├── StudentDashboard (Protected Route)
│   │   ├── DashboardHeader
│   │   ├── Sidebar Navigation
│   │   ├── StudentHome (Main Dashboard)
│   │   ├── StudentCourses
│   │   │   └── CourseDetailsModal
│   │   ├── StudentAssignments
│   │   ├── StudentSubmissions
│   │   ├── StudentGrades
│   │   ├── StudentAttendance
│   │   ├── StudentFees
│   │   ├── StudentTimetable
│   │   ├── StudentLibrary
│   │   ├── StudentMaterials
│   │   ├── StudentSchedule
│   │   ├── StudentLeave
│   │   ├── StudentAnnouncements
│   │   ├── StudentInbox
│   │   ├── StudentMessage
│   │   ├── ChangePassword
│   │   └── DashboardFooter
│   │
│   ├── TeacherDashboard (Protected Route)
│   │   ├── DashboardHeader
│   │   ├── Sidebar Navigation
│   │   ├── TeacherHome (Main Dashboard)
│   │   ├── TeacherCourses
│   │   │   └── TeacherCourseManageModal
│   │   ├── TeacherAssignmentsList
│   │   │   └── TeacherCreateAssignmentForm
│   │   ├── TeacherAttendance
│   │   ├── TeacherStudents
│   │   ├── TeacherMaterials
│   │   ├── TeacherTimetable
│   │   ├── TeacherSchedule
│   │   ├── TeacherAnnouncementsList
│   │   │   └── TeacherCreateAnnouncementForm
│   │   ├── TeacherLeave
│   │   ├── TeacherInbox
│   │   ├── ChangePassword
│   │   └── DashboardFooter
│   │
│   ├── AdminDashboard (Protected Route)
│   │   ├── DashboardHeader
│   │   ├── Sidebar Navigation
│   │   ├── ClassManagement
│   │   ├── CourseManagement
│   │   ├── AdminTimetableManagement
│   │   ├── AdminLibraryManagement
│   │   ├── AtRiskStudentsModal
│   │   ├── ChangePassword
│   │   └── DashboardFooter
│   │
│   └── ReduxDemo (Development/Testing)
│
├── NotificationToast (Global Notification System)
└── Config
    ├── studentModules.js (Student Menu Config)
    └── teacherModules.js (Teacher Menu Config)
```

---

## 3. Backend Architecture

### 3.1 Server Structure

```
Backend/
├── server.js (Express Entry Point)
├── controllers.js (Legacy Controllers)
│
├── config/
│   ├── database.js (MongoDB Connection)
│   └── multer.js (File Upload Config)
│
├── middleware/
│   ├── auth.js (JWT Authentication)
│   └── upload.js (File Upload Middleware)
│
├── models/ (MongoDB Schemas)
│   ├── User.js (Students, Teachers, Admins)
│   ├── Course.js (Course Information)
│   ├── Assignment.js (Assignment Details)
│   ├── Submission.js (Student Submissions)
│   ├── Grade.js (Grade Records)
│   ├── Attendance.js (Attendance Tracking)
│   ├── Schedule.js (Class Schedules)
│   ├── Timetable.js (Weekly Timetables)
│   ├── Fee.js (Fee Configuration)
│   ├── Payment.js (Payment Records)
│   ├── Announcement.js (System Announcements)
│   ├── Message.js (User Messages)
│   ├── LibraryResource.js (Library Books/Resources)
│   ├── StudyMaterial.js (Study Materials)
│   ├── LeaveRequest.js (Leave Applications)
│   ├── Remark.js (Teacher Remarks)
│   └── database.js (Database Models Export)
│
├── controllers/ (Business Logic Layer)
│   ├── authController.js (User Authentication)
│   ├── studentController.js (Student Operations)
│   ├── teacherController.js (Teacher Operations)
│   ├── adminController.js (Admin Operations)
│   └── messageController.js (Messaging System)
│
├── routes/ (API Endpoints)
│   ├── authRoutes.js (Auth Endpoints)
│   ├── studentRoutes.js (Student Endpoints)
│   ├── teacherRoutes.js (Teacher Endpoints)
│   ├── adminRoutes.js (Admin Endpoints)
│   └── messageRoutes.js (Message Endpoints)
│
└── uploads/ (File Storage)
    ├── assignments/
    ├── submissions/
    ├── library/
    ├── study-materials/
    └── timetables/
```

### 3.2 API Routes Structure

#### Authentication Routes (`/api/auth`)
```
POST   /register              Register new user
POST   /login                 User login
GET    /profile               Get user profile
POST   /change-password       Change password
POST   /logout                User logout
```

#### Student Routes (`/api/students`)
```
GET    /dashboard             Student dashboard statistics
GET    /courses               Enrolled courses list
GET    /courses/:id           Course details
GET    /grades                View grades
GET    /attendance            Attendance records
GET    /assignments           List assignments
POST   /assignments/:id/submit Submit assignment
GET    /timetable             Class schedule
GET    /fees                  Fee information
POST   /payment               Make payment
GET    /library               Library resources
GET    /materials             Study materials
GET    /announcements         System announcements
GET    /leave-requests        Leave request history
POST   /leave-requests        Submit leave request
```

#### Teacher Routes (`/api/teachers`)
```
GET    /dashboard             Teacher dashboard
GET    /courses               Managed courses
POST   /courses               Create course
PUT    /courses/:id           Update course
GET    /assignments           Assignments list
POST   /assignments           Create assignment
GET    /submissions/:id       View submissions
POST   /submissions/:id/grade Grade submission
GET    /students              Student list
POST   /attendance            Mark attendance
GET    /announcements         Create/view announcements
GET    /materials             Manage materials
GET    /timetable             View/manage timetable
```

#### Admin Routes (`/api/admin`)
```
GET    /dashboard             Admin dashboard
GET    /users                 All users list
POST   /users                 Create user
PUT    /users/:id             Update user
DELETE /users/:id             Delete user
GET    /fees                  Fee configuration
POST   /fees                  Create fee structure
PUT    /fees/:id              Update fee structure
POST   /announcements         Broadcast announcement
GET    /reports               System reports
GET    /settings              System settings
PUT    /settings              Update settings
```

#### Message Routes (`/api/messages`)
```
GET    /                      Get user messages
POST   /                      Send message
GET    /:id                   Get conversation
DELETE /:id                   Delete message
```

---

## 4. Data Model Relationships

```
User (Base Model)
├── id, email, password, role (student/teacher/admin)
├── name, phone, address, profilePic
└── createdAt, updatedAt

├── Student (inherits User)
│   ├── enrolledCourses: [Course]
│   ├── grades: [Grade]
│   ├── attendance: [Attendance]
│   ├── assignments: [Assignment]
│   ├── submissions: [Submission]
│   ├── fees: [Fee]
│   ├── payments: [Payment]
│   ├── leaveRequests: [LeaveRequest]
│   └── borrowedResources: [LibraryResource]
│
├── Teacher (inherits User)
│   ├── courses: [Course]
│   ├── assignments: [Assignment]
│   ├── attendance: [Attendance]
│   ├── schedule: [Schedule]
│   ├── remarks: [Remark]
│   └── materials: [StudyMaterial]
│
└── Admin (inherits User)
    ├── managedCourses: [Course]
    ├── systemAnnouncements: [Announcement]
    ├── feeStructure: [Fee]
    └── systemSettings: Object

Course
├── id, name, code, description
├── instructor: Teacher
├── students: [Student]
├── schedule: Schedule
├── timetable: Timetable
├── assignments: [Assignment]
├── materials: [StudyMaterial]
└── createdAt, updatedAt

Assignment
├── id, title, description, dueDate
├── course: Course
├── instructor: Teacher
├── submissions: [Submission]
├── totalMarks, createdAt, updatedAt
└── attachments: [File]

Submission
├── id, assignmentId, studentId
├── submissionFile, submittedAt
├── status: (submitted/graded/pending)
├── marks, feedback
└── submittedAt, gradedAt

Grade
├── id, studentId, courseId
├── marksObtained, totalMarks
├── percentage, grade (A/B/C/D/F)
└── createdAt, updatedAt

Attendance
├── id, studentId, courseId
├── date, status (present/absent)
├── remarks
└── recordedBy: Teacher

Fee
├── id, name, amount
├── dueDate, category
├── applicable: [Student]
└── createdAt, updatedAt

Payment
├── id, studentId, feeId
├── amount, paymentDate
├── status: (pending/completed)
├── transactionId
└── processedAt

LibraryResource
├── id, title, author
├── ISBN, category
├── quantity, available
├── borrowedBy: [Student]
└── borrowDate, dueDate

LeaveRequest
├── id, studentId, teacherId
├── startDate, endDate, reason
├── status: (pending/approved/rejected)
├── approvedBy: Teacher
└── createdAt, updatedAt

Announcement
├── id, title, content
├── postedBy: User
├── targetAudience: [role/user]
├── priority: (high/medium/low)
└── postedAt, updatedAt

Message
├── id, sender, recipient
├── content, attachments
├── timestamp, read: boolean
└── conversation: id

Timetable
├── id, courseId
├── schedule: {day, startTime, endTime, room}
├── createdBy: Teacher
└── createdAt, updatedAt

StudyMaterial
├── id, title, courseId
├── fileUrl, uploadedBy: Teacher
├── description, category
└── uploadedAt

Schedule
├── id, courseId, instructorId
├── startDate, endDate
├── classRoom, capacity
└── slots: [time, day]

Remark
├── id, studentId, courseId
├── remark, remarks: Teacher
└── createdAt

```

---

## 5. User Flows & Wireframes

### 5.1 Student User Flow

```
Landing Page
    ↓
[Login/Register] 
    ↓
Student Dashboard
    ├─→ Home (Welcome, Quick Stats)
    │   ├─→ Courses Overview
    │   ├─→ Recent Announcements
    │   └─→ Upcoming Assignments
    │
    ├─→ My Courses
    │   └─→ Course Details
    │       ├─→ Schedule
    │       ├─→ Materials
    │       ├─→ Announcements
    │       └─→ Participants
    │
    ├─→ Assignments
    │   └─→ Assignment Details
    │       ├─→ Description & Files
    │       ├─→ Submit Assignment
    │       └─→ View Submission Status
    │
    ├─→ Grades
    │   └─→ Grade Report (by course/semester)
    │
    ├─→ Attendance
    │   └─→ Attendance Report
    │
    ├─→ Fees & Payments
    │   ├─→ View Fees
    │   ├─→ Make Payment
    │   └─→ Payment History
    │
    ├─→ Timetable
    │   └─→ Weekly/Daily Schedule
    │
    ├─→ Library
    │   ├─→ Browse Resources
    │   ├─→ Borrow Resource
    │   └─→ My Borrowed Items
    │
    ├─→ Study Materials
    │   └─→ Download Materials
    │
    ├─→ Announcements
    │   └─→ View All Announcements
    │
    ├─→ Leave Request
    │   ├─→ Apply for Leave
    │   └─→ Leave History
    │
    ├─→ Messages
    │   ├─→ Inbox
    │   ├─→ Compose Message
    │   └─→ View Conversation
    │
    └─→ Settings
        ├─→ Profile
        ├─→ Change Password
        └─→ Notifications
```

### 5.2 Teacher User Flow

```
Landing Page
    ↓
[Login/Register]
    ↓
Teacher Dashboard
    ├─→ Home (Welcome, Quick Stats)
    │   ├─→ Courses Overview
    │   ├─→ Pending Submissions
    │   └─→ Today's Schedule
    │
    ├─→ My Courses
    │   └─→ Course Details
    │       ├─→ Students List
    │       ├─→ Course Settings
    │       ├─→ Materials
    │       └─→ Announcements
    │
    ├─→ Assignments
    │   ├─→ Create Assignment
    │   ├─→ Assignment List
    │   └─→ View Submissions
    │       ├─→ Grade Submission
    │       ├─→ Add Remarks
    │       └─→ Send Feedback
    │
    ├─→ Attendance
    │   ├─→ Mark Attendance
    │   └─→ Attendance Reports
    │
    ├─→ Students
    │   └─→ Student Details
    │       ├─→ Grades
    │       ├─→ Attendance
    │       └─→ Remarks
    │
    ├─→ Materials
    │   ├─→ Upload Material
    │   └─→ Manage Materials
    │
    ├─→ Timetable
    │   ├─→ View Timetable
    │   └─→ Manage Schedule
    │
    ├─→ Schedule
    │   └─→ Class Schedules
    │
    ├─→ Announcements
    │   ├─→ Create Announcement
    │   └─→ Announcement List
    │
    ├─→ Leave
    │   ├─→ Apply for Leave
    │   └─→ Leave History
    │
    ├─→ Messages
    │   ├─→ Inbox
    │   ├─→ Compose Message
    │   └─→ View Conversation
    │
    └─→ Settings
        ├─→ Profile
        ├─→ Change Password
        └─→ Notifications
```

### 5.3 Admin User Flow

```
Landing Page
    ↓
[Login/Register]
    ↓
Admin Dashboard
    ├─→ Home (System Overview)
    │   ├─→ Total Users Stats
    │   ├─→ System Health
    │   └─→ Recent Activities
    │
    ├─→ Class Management
    │   ├─→ Add/Edit/Delete Classes
    │   └─→ Assign Teachers
    │
    ├─→ Course Management
    │   ├─→ Create Course
    │   ├─→ Edit Course
    │   ├─→ Delete Course
    │   └─→ Manage Course Content
    │
    ├─→ Timetable Management
    │   ├─→ Create Timetable
    │   ├─→ Edit Schedule
    │   └─→ View All Timetables
    │
    ├─→ Library Management
    │   ├─→ Add Resources
    │   ├─→ Edit Resources
    │   └─→ Remove Resources
    │
    ├─→ User Management
    │   ├─→ Add Student
    │   ├─→ Add Teacher
    │   ├─→ Edit User
    │   ├─→ Deactivate User
    │   └─→ Bulk Import
    │
    ├─→ Fee Management
    │   ├─→ Set Fee Structure
    │   ├─→ View Collections
    │   └─→ Payment Reports
    │
    ├─→ Announcements
    │   ├─→ Create Announcement
    │   ├─→ Edit Announcement
    │   └─→ Target Audience Settings
    │
    ├─→ At-Risk Students
    │   └─→ View & Monitor At-Risk Students
    │
    ├─→ Reports
    │   ├─→ Attendance Reports
    │   ├─→ Grade Reports
    │   ├─→ Fee Collection Reports
    │   └─→ System Usage Reports
    │
    ├─→ Settings
    │   ├─→ System Configuration
    │   ├─→ Academic Year Settings
    │   ├─→ School Settings
    │   └─→ Email Configuration
    │
    └─→ Account Management
        ├─→ Profile
        ├─→ Change Password
        └─→ Logout
```

---

## 6. State Management (Redux)

### 6.1 Redux Structure

```
store/
└── store.js (Redux Configuration)
    └── slices/ (Redux Slices)
        ├── authSlice.js
        │   ├── State: {user, token, isAuthenticated, role}
        │   ├── Actions: login, logout, register, updateProfile
        │   └── Selectors: selectUser, selectRole, selectAuth
        │
        ├── studentSlice.js
        │   ├── State: {courses, assignments, grades, attendance, fees}
        │   ├── Actions: fetchCourses, submitAssignment, viewGrades
        │   └── Selectors: selectCourses, selectGrades
        │
        ├── teacherSlice.js
        │   ├── State: {courses, submissions, students, materials}
        │   ├── Actions: createAssignment, gradeSubmission, createAnnouncement
        │   └── Selectors: selectCourses, selectStudents
        │
        ├── adminSlice.js
        │   ├── State: {users, courses, fees, announcements}
        │   ├── Actions: addUser, deleteUser, updateFeeStructure
        │   └── Selectors: selectUsers, selectCourses
        │
        └── messageSlice.js
            ├── State: {messages, conversations, notifications}
            ├── Actions: sendMessage, fetchConversation, markAsRead
            └── Selectors: selectMessages, selectConversations
```

---

## 7. Key Features Breakdown

### 7.1 Authentication & Authorization
- **JWT-based Authentication**: Secure token generation and validation
- **Role-based Access Control (RBAC)**: Student, Teacher, Admin roles
- **Protected Routes**: Frontend route guards using AuthContext
- **Middleware Auth**: Backend middleware for endpoint protection

### 7.2 Student Features
- Dashboard with quick stats
- Course enrollment and tracking
- Assignment submission with file uploads
- Grade viewing and performance tracking
- Attendance monitoring
- Fee payment and receipt generation
- Library resource browsing and borrowing
- Study material download
- Announcements and notifications
- Leave request application
- Messaging system
- Profile management

### 7.3 Teacher Features
- Course management and student listing
- Assignment creation with deadline tracking
- Submission grading and feedback
- Attendance marking and reporting
- Study material uploading
- Timetable management
- Announcement creation
- Student performance monitoring
- Leave management
- Messaging with students
- Profile management

### 7.4 Admin Features
- System-wide user management (add, edit, delete)
- Course and class management
- Timetable scheduling
- Library resource management
- Fee structure configuration
- Payment tracking and reporting
- System announcements
- At-risk student monitoring
- System settings and configuration
- Comprehensive reporting and analytics

### 7.5 Real-time Features
- **Messaging System**: Real-time messaging using Socket.io
- **Notifications**: Toast notifications for actions and updates
- **Live Updates**: Course and assignment updates

---

## 8. Technology Stack Summary

### Frontend Stack
- **React 18**: UI library
- **Vite**: Modern build tool (fast HMR)
- **Redux Toolkit**: State management
- **Axios**: HTTP client
- **CSS/SCSS**: Styling
- **Socket.io-client**: Real-time messaging

### Backend Stack
- **Node.js**: Runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **Multer**: File upload handling
- **Bcrypt**: Password encryption
- **Dotenv**: Environment variables

### Additional Tools
- **ESLint**: Code linting
- **Postman**: API testing
- **MongoDB Atlas**: Cloud database (optional)

---

## 9. File Structure Summary

```
EduAxis/
├── README.md (Project documentation)
├── PROJECT_WIREFRAME.md (This file)
│
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── .env (Environment variables)
│   ├── config/ (Database & Upload configuration)
│   ├── controllers/ (Business logic)
│   ├── middleware/ (Auth & Upload middleware)
│   ├── models/ (MongoDB schemas)
│   ├── routes/ (API endpoints)
│   └── uploads/ (File storage)
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/ (Reusable components)
│   │   ├── pages/ (Page components)
│   │   ├── context/ (Context API - Auth, Socket)
│   │   ├── hooks/ (Custom hooks)
│   │   ├── services/ (API services)
│   │   ├── store/ (Redux store)
│   │   ├── config/ (App configuration)
│   │   ├── App.css
│   │   └── index.css
│   └── public/ (Static assets)
```

---

## 10. Development Workflow

### Setup & Installation
1. Clone repository
2. Install backend dependencies: `cd Backend && npm install`
3. Install frontend dependencies: `cd ../frontend && npm install`
4. Configure `.env` file in Backend
5. Start MongoDB
6. Run backend: `npm start` (from Backend)
7. Run frontend: `npm run dev` (from frontend)

### Development Cycle
1. Create feature branch
2. Develop backend API endpoints
3. Develop frontend components
4. Integrate Redux state management
5. Test with Postman/testing tools
6. Update documentation
7. Create pull request

### Testing & Deployment
- Test APIs using Postman
- Manual testing on frontend
- Use test credentials provided in README
- Deploy backend to hosting (Heroku, AWS, etc.)
- Deploy frontend to CDN (Vercel, Netlify, etc.)

---

## 11. Key Implementation Details

### Authentication Flow
```
User Input (Email/Password)
    ↓
Frontend: Send to /api/auth/login
    ↓
Backend: Validate credentials
    ↓
Backend: Generate JWT Token
    ↓
Frontend: Store token in localStorage/Redux
    ↓
Frontend: Set Authorization header for future requests
    ↓
Backend Middleware: Verify token on protected routes
```

### Assignment Submission Flow
```
Student selects assignment
    ↓
Student fills details & uploads file
    ↓
Frontend: POST to /api/students/assignments/:id/submit
    ↓
Backend Multer: Handle file upload
    ↓
Backend: Create Submission record in DB
    ↓
Frontend: Show success notification
    ↓
Teacher: Receives notification of new submission
    ↓
Teacher: Accesses submission and adds grade/feedback
    ↓
Student: Can view graded submission and feedback
```

### Message Flow
```
Sender composes message
    ↓
Frontend: Send via Socket.io
    ↓
Backend: Store in Message DB
    ↓
Backend: Emit via Socket.io to receiver
    ↓
Receiver: Receives real-time notification
    ↓
Frontend: Update inbox UI in real-time
```

---

## 12. Future Enhancements

- [ ] Email notification system
- [ ] SMS alerts for important notifications
- [ ] Advanced grade calculation with weighted assessments
- [ ] Parent portal for student monitoring
- [ ] Mobile application (React Native/Flutter)
- [ ] Analytics dashboard with charts
- [ ] Attendance QR code system
- [ ] Video conferencing integration
- [ ] Online exam system
- [ ] AI-based student performance prediction
- [ ] Biometric attendance system
- [ ] Payment gateway integration (Stripe, PayPal)

---

## 13. Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control at backend
3. **Input Validation**: Sanitize inputs on both frontend and backend
4. **File Upload**: Validate file types and sizes with Multer
5. **Database**: Use MongoDB indexes for performance
6. **Environment Variables**: Secure sensitive data
7. **HTTPS**: Use SSL/TLS in production
8. **CORS**: Configure allowed origins
9. **Rate Limiting**: Implement API rate limiting
10. **Password Security**: Hash passwords with bcrypt

---

## 14. Performance Optimization

1. **Frontend**:
   - Code splitting with Vite
   - Lazy loading of components
   - Image optimization
   - Caching with Redux

2. **Backend**:
   - Database indexing
   - Query optimization
   - Caching strategies
   - Pagination for large datasets

3. **Database**:
   - Proper schema design
   - Indexing on frequently queried fields
   - Connection pooling

---

## Document Information

- **Created**: February 2, 2026
- **Project**: EduAxis v1.0
- **Type**: System Architecture & Wireframe
- **Status**: Complete

For more detailed information, refer to the main README.md and additional documentation files.
