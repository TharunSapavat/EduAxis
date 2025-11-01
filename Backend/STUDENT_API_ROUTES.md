# Student Dashboard API Routes Documentation

All routes require **authentication** (`authMiddleware`) and **student role** (`roleMiddleware('student')`).

Base URL: `/api/students`

---

## 📊 Dashboard

### GET `/dashboard`
Get student dashboard statistics and overview.

**Query Parameters:**
- `studentId` (required): Student ID

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalCourses": 5,
    "attendance": 85,
    "currentGrade": "A-",
    "pendingAssignments": 3
  }
}
```

---

## 📚 Courses

### GET `/courses`
Get all active courses for the student.

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "_id": "course_id",
      "name": "Mathematics",
      "code": "MATH101",
      "teacherId": { "name": "John Doe", "email": "john@school.com" },
      "status": "active"
    }
  ]
}
```

### GET `/courses/:id`
Get detailed information about a specific course.

**Response:**
```json
{
  "success": true,
  "course": {
    "_id": "course_id",
    "name": "Mathematics",
    "recentAssignments": [...],
    "recentAnnouncements": [...]
  }
}
```

---

## 📝 Grades

### GET `/grades`
Get all graded assignments and calculated grades.

**Query Parameters:**
- `studentId` (required): Student ID

**Response:**
```json
{
  "success": true,
  "grades": [
    {
      "subject": "Mathematics",
      "marks": 85,
      "total": 100,
      "grade": "A",
      "assignment": "Mid-term Exam",
      "date": "2025-10-15T00:00:00.000Z"
    }
  ]
}
```

---

## ✅ Attendance

### GET `/attendance`
Get attendance records and statistics.

**Query Parameters:**
- `studentId` (required): Student ID

**Response:**
```json
{
  "success": true,
  "attendance": {
    "overall": 85,
    "present": 42,
    "absent": 3,
    "late": 2,
    "excused": 1,
    "total": 48,
    "records": [...]
  }
}
```

---

## 📋 Assignments

### GET `/assignments`
Get all assignments for the student.

**Query Parameters:**
- `studentId` (required): Student ID

**Response:**
```json
{
  "success": true,
  "assignments": [
    {
      "_id": "assignment_id",
      "title": "Chapter 5 Problems",
      "description": "Solve problems 1-10",
      "subject": "Mathematics",
      "dueDate": "2025-11-15T00:00:00.000Z",
      "totalMarks": 100,
      "courseId": {...},
      "teacherId": {...}
    }
  ]
}
```

### POST `/assignments/submit`
Submit an assignment.

**Request Body:**
```json
{
  "assignmentId": "assignment_id",
  "content": "My submission text...",
  "attachments": [
    {
      "name": "solution.pdf",
      "url": "https://..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "submission": {
    "_id": "submission_id",
    "assignmentId": "...",
    "studentId": "...",
    "status": "submitted",
    "submittedAt": "2025-11-02T12:00:00.000Z"
  }
}
```

### GET `/assignments/:assignmentId/submission`
Get submission details for a specific assignment.

**Response:**
```json
{
  "success": true,
  "submission": {
    "_id": "submission_id",
    "assignmentId": {...},
    "content": "My submission...",
    "attachments": [...],
    "status": "graded",
    "marks": 85,
    "feedback": "Great work!",
    "submittedAt": "...",
    "gradedAt": "...",
    "gradedBy": { "name": "Teacher Name" }
  }
}
```

---

## 📅 Timetable

### GET `/timetable`
Get student's class timetable.

**Query Parameters:**
- `day` (optional): Get schedule for specific day (Monday, Tuesday, etc.)

**Response:**
```json
{
  "success": true,
  "timetable": {
    "grade": "10",
    "section": "A",
    "academicYear": "2025-2026",
    "semester": "Fall",
    "schedule": [
      {
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "10:00",
        "subject": "Mathematics",
        "courseId": {...},
        "teacherId": {...},
        "room": "A101",
        "type": "lecture"
      }
    ],
    "todaySchedule": [...]
  }
}
```

---

## 📢 Announcements

### GET `/announcements`
Get all active announcements for students.

**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "_id": "announcement_id",
      "title": "Holiday Notice",
      "content": "School will be closed...",
      "priority": "high",
      "targetAudience": "students",
      "isActive": true,
      "createdBy": { "name": "Admin" },
      "createdAt": "2025-11-01T00:00:00.000Z"
    }
  ]
}
```

---

## 💰 Fees & Payments

### GET `/fees`
Get student's fee information and payment history.

**Response:**
```json
{
  "success": true,
  "studentGrade": "10",
  "studentSection": "A",
  "fees": [
    {
      "_id": "fee_id",
      "title": "Tuition Fee - Semester 1",
      "amount": 50000,
      "description": "Regular tuition fee",
      "dueDate": "2025-12-01T00:00:00.000Z",
      "semester": "Fall",
      "status": "active"
    }
  ],
  "payments": [
    {
      "_id": "payment_id",
      "receiptNumber": "RCP-2025-001",
      "feeTitle": "Tuition Fee",
      "amount": 50000,
      "paymentMethod": "UPI",
      "status": "completed",
      "paymentDate": "2025-10-15T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalFees": 100000,
    "totalPaid": 50000,
    "pending": 50000,
    "lateFees": 0,
    "totalDue": 50000
  }
}
```

### POST `/payment`
Make a fee payment.

**Request Body:**
```json
{
  "feeId": "fee_id",
  "amount": 50000,
  "paymentMethod": "UPI",
  "transactionId": "TXN123456789",
  "remarks": "Payment for semester 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful",
  "payment": {
    "_id": "payment_id",
    "receiptNumber": "RCP-2025-002",
    "amount": 50000,
    "status": "completed"
  },
  "lateFee": 0
}
```

### GET `/receipt/:paymentId`
Download payment receipt.

**Response:**
```json
{
  "success": true,
  "receipt": {
    "receiptNumber": "RCP-2025-001",
    "date": "2025-10-15T00:00:00.000Z",
    "student": {
      "name": "Student Name",
      "email": "student@email.com",
      "id": "STU001"
    },
    "fee": {
      "title": "Tuition Fee",
      "amount": 50000
    },
    "payment": {
      "amount": 50000,
      "method": "UPI",
      "transactionId": "TXN123456789",
      "status": "completed"
    }
  }
}
```

---

## 📖 Library

### GET `/library`
Get library resources and borrowed books.

**Response:**
```json
{
  "success": true,
  "library": {
    "availableResources": [
      {
        "id": "1",
        "title": "Mathematics Textbook - Grade 10",
        "type": "Textbook",
        "subject": "Mathematics",
        "format": "PDF",
        "availableOnline": true,
        "downloadUrl": "/api/library/download/1",
        "description": "Official mathematics textbook"
      }
    ],
    "borrowedBooks": [
      {
        "id": "b1",
        "title": "History of Ancient Civilizations",
        "borrowedDate": "2025-10-26T00:00:00.000Z",
        "dueDate": "2025-11-09T00:00:00.000Z",
        "status": "active"
      }
    ],
    "borrowingLimit": 5,
    "currentBorrowed": 1
  }
}
```

---

## 🔒 Authentication

All routes require:
1. **JWT Token** in Authorization header: `Bearer <token>`
2. **Student Role** - User must have role='student'

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not a student
- `400 Bad Request` - Missing required parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 📌 Notes

1. **Late Fee Calculation**: ₹10 per day after due date for fee payments
2. **Assignment Submissions**: Marked as 'late' if submitted after due date
3. **Timetable**: Returns sample data if no timetable configured for the grade/section
4. **Library**: Currently returns sample data - LibraryResource model needs to be created
5. **Course Enrollment**: All students see all active courses (TODO: implement enrollment system)

---

## 🔜 Future Enhancements

- [ ] Create LibraryResource model with book borrowing system
- [ ] Implement student-course enrollment system
- [ ] Add file upload functionality for assignment submissions
- [ ] Generate PDF receipts for payments
- [ ] Add email notifications for payments and assignments
- [ ] Implement grade calculation based on multiple assessments
- [ ] Add parent access to student dashboard
