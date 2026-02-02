# EduAxis 

A comprehensive School Management System built with **Node.js**, **Express**, **MongoDB**, and **React** that streamlines educational administration, teaching, and learning processes.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)

## Features

### Student Dashboard
- **Academic Overview**: View courses, grades, and attendance statistics
- **Assignment Management**: Submit assignments with file attachments and track submissions
- **Timetable**: Access class schedules and daily routines
- **Fee Management**: View fees, make payments, and download receipts
- **Library Access**: Browse available resources and manage borrowed books
- **Announcements**: Stay updated with school-wide notifications

### Teacher Portal
- **Course Management**: Create and manage courses
- **Assignment & Grading**: Create assignments, review submissions, and provide feedback
- **Attendance Tracking**: Mark and manage student attendance
- **Student Progress**: Monitor individual and class performance

### Admin Panel
- **User Management**: Manage students, teachers, and staff accounts
- **Fee Structure**: Configure fee categories and payment tracking
- **Announcements**: Broadcast important messages to different user groups
- **System Configuration**: Manage academic years, semesters, and school settings

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Environment Variables**: dotenv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Styling**: CSS/SCSS
- **Linting**: ESLint

## Project Structure

```
EduAxis/
├── Backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   └── multer.js            # File upload configuration
│   ├── controllers/
│   │   ├── adminController.js   # Admin-specific logic
│   │   ├── authController.js    # Authentication logic
│   │   ├── messageController.js # Messaging system
│   │   ├── studentController.js # Student dashboard logic
│   │   └── teacherController.js # Teacher portal logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── upload.js            # File upload middleware
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API route definitions
│   ├── server.js                # Express server entry point
│   ├── package.json
│   └── .env                     # Environment variables
│
└── frontend/
    ├── src/                     # React components and logic
    ├── public/                  # Static assets
    ├── index.html
    ├── vite.config.js           # Vite configuration
    └── package.json
```

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EduAxis.git
   cd EduAxis
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `Backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/eduaxis
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start Development Servers**

   **Backend** (from `Backend` directory):
   ```bash
   npm start
   ```

   **Frontend** (from `frontend` directory):
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (requires authentication)

### Student Routes
All student routes require authentication and student role. See [STUDENT_API_ROUTES.md](Backend/STUDENT_API_ROUTES.md) for detailed documentation.

**Base URL**: `/api/students`

- `GET /dashboard` - Student dashboard statistics
- `GET /courses` - Get enrolled courses
- `GET /grades` - View grades and assessments
- `GET /attendance` - Attendance records
- `GET /assignments` - List assignments
- `POST /assignments/submit` - Submit assignment
- `GET /timetable` - Class schedule
- `GET /fees` - Fee information and payment history
- `POST /payment` - Make fee payment
- `GET /library` - Library resources and borrowed books

### Teacher Routes
**Base URL**: `/api/teachers`

- Course management endpoints
- Assignment creation and grading
- Attendance marking
- Student performance tracking

### Admin Routes
**Base URL**: `/api/admin`

- User management
- Fee structure configuration
- Announcement broadcasting
- System settings

## Authentication

EduAxis uses **JWT (JSON Web Tokens)** for authentication.

### Request Headers
```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- `student` - Access to student dashboard
- `teacher` - Access to teacher portal
- `admin` - Full system access

**TEST Crendentials:-**
**  EMAIL:-** student@gmail.com  teacher@gmail.com  tharun@gmail.com
**password** zxcvbnm


## Additional Documentation

- [Student API Routes](Backend/STUDENT_API_ROUTES.md) - Detailed student endpoint documentation
- [Testing Guide](Backend/TESTING_GUIDE.md) - API testing instructions
- [Implementation Summary](Backend/IMPLEMENTATION_SUMMARY.md) - Development overview
- [Redux Integration](frontend/REDUX_INTEGRATION.md) - State management guide

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Library resource management system with book borrowing
- [ ] Email notifications for assignments and payments
- [ ] Advanced grade calculation with weighted assessments
- [ ] Parent portal for student monitoring
- [ ] Real-time messaging system
- [ ] Mobile application (React Native)
- [ ] Advanced analytics and reporting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for educational institutions
- Inspired by modern school management needs
- Thanks to all contributors and supporters

---

**Note**: This is an educational project. For production use, ensure proper security measures, data validation, and error handling are implemented.

For questions or support, please open an issue on GitHub.
