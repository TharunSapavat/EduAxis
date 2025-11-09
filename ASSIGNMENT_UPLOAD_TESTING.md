# Assignment File Upload Testing Guide

## Overview
The assignment creation feature now supports uploading files from your system instead of URLs. Files are stored on the server and can be downloaded by students in the respective grade.

## Features Implemented

### Backend Changes
1. **Multer Configuration** (`Backend/config/multer.js`)
   - Handles multipart/form-data file uploads
   - Stores files in `Backend/uploads/assignments/`
   - File size limit: 10MB per file
   - Accepted file types: PDF, Word, PowerPoint, Excel, Images, Text, ZIP

2. **Upload Endpoint** (`Backend/controllers/teacherController.js`)
   - Updated `createAssignment` to process uploaded files
   - Stores file metadata (name, filename, path, size, mimetype)
   - Emits real-time socket event to notify students

3. **File Serving** (`Backend/server.js`)
   - Static file serving from `/uploads` endpoint
   - Files accessible at `http://localhost:5000/uploads/assignments/{filename}`

4. **Assignment Model** (`Backend/models/Assignment.js`)
   - Updated attachments schema to support both file uploads and URLs
   - Fields: name, filename, path, size, mimetype, url

### Frontend Changes
1. **Teacher Dashboard** (`frontend/src/pages/TeacherDashboard.jsx`)
   - File input with multiple file selection
   - Displays selected files with size before upload
   - Sends files via FormData with multipart/form-data
   - Shows uploaded files in assignment list with download links

2. **Student Dashboard** (`frontend/src/pages/StudentDashboard.jsx`)
   - Displays assignment attachments with file icons
   - Shows file name and size
   - Download links for each attachment
   - Real-time updates when new assignments are created

3. **API Service** (`frontend/src/services/api.js`)
   - Updated `createAssignment` to handle FormData
   - Automatically sets correct Content-Type header

## Testing Steps

### 1. Start Backend Server
```bash
cd Backend
npm run dev
```
Expected output: Server running on port 5000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Expected output: Frontend running on port 5173

### 3. Test as Teacher

#### Login as Teacher
- Navigate to `http://localhost:5173`
- Login with teacher credentials:
  - Email: `teacher@school.com`
  - Password: (your teacher password)

#### Create Assignment with Files
1. Go to **Grading** module
2. Fill in the form:
   - **Course**: Select a course (e.g., "Mathematics - Grade 10")
   - **Title**: "Chapter 5 Assignment"
   - **Description**: "Complete exercises 1-10"
   - **Due Date**: Select a future date
   - **Total Marks**: 50
   - **Attachments**: Click "Choose Files"
     - Select 1-5 files (PDF, DOCX, images, etc.)
     - Verify files appear in the list with names and sizes
3. Click **Create Assignment**
4. Success message should appear
5. Assignment should appear in the list below with:
   - Title, course, due date, marks
   - Attachments section showing file names and sizes
   - Download links for each file

### 4. Test as Student (Same Grade)

#### Login as Student
- Logout from teacher account
- Login with student credentials matching the course grade:
  - Email: `student@school.com` (or student with grade 10)
  - Password: (your student password)

#### View Assignment
1. Go to **Assignments** module
2. The newly created assignment should appear (real-time or after refresh)
3. Verify the assignment shows:
   - Title: "Chapter 5 Assignment"
   - Course name, due date, marks
   - Description
   - **Attachments section** with:
     - File icon 📎
     - File names with sizes
     - Blue download links

#### Download Files
1. Click on any attachment link
2. File should download or open in new tab
3. Verify the downloaded file is correct

### 5. Test as Student (Different Grade)

#### Login as Different Grade Student
- Login with student from different grade (e.g., Grade 11)
- Go to **Assignments** module
- Verify the Grade 10 assignment **does NOT appear**
- Only assignments for Grade 11 should be visible

## Verification Checklist

### Teacher Side
- [ ] File input accepts multiple files
- [ ] Selected files display with names and sizes
- [ ] Files can be removed before upload
- [ ] Form submits successfully with files
- [ ] Success message appears
- [ ] Created assignment appears in list
- [ ] Attachments show with download links in teacher's view
- [ ] File size displays correctly

### Student Side
- [ ] Assignment appears for correct grade students
- [ ] Assignment does NOT appear for wrong grade students
- [ ] Attachments section displays properly
- [ ] File names and sizes are correct
- [ ] Download links work
- [ ] Files download correctly
- [ ] Real-time update works (no page refresh needed)

### Backend
- [ ] Files saved in `Backend/uploads/assignments/`
- [ ] File names are unique (timestamp-based)
- [ ] File metadata stored in database
- [ ] Static file serving works
- [ ] Socket.IO emits assignment creation event
- [ ] Only authenticated teachers can upload

## File Upload Limits & Restrictions

### Accepted File Types
- **Documents**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
- **Images**: JPG, JPEG, PNG, GIF
- **Archives**: ZIP

### File Size
- Maximum: **10MB per file**
- Maximum files: **5 per assignment**

### Error Handling
- Invalid file type → Error message shown
- File too large → Error message shown
- Network error → Retry option
- No files selected → Assignment created without attachments (optional)

## File Storage Structure
```
Backend/
  uploads/
    assignments/
      originalname-1699564800000-123456789.pdf
      worksheet-1699564900000-987654321.docx
```

## Database Schema
```javascript
attachments: [
  {
    name: "Chapter 5 Worksheet.pdf",        // Original filename
    filename: "worksheet-1699564800000.pdf", // Stored filename
    path: "/uploads/assignments/worksheet-1699564800000.pdf",
    size: 524288,                           // Bytes
    mimetype: "application/pdf"
  }
]
```

## Troubleshooting

### Files Not Uploading
1. Check backend console for errors
2. Verify `uploads/assignments` directory exists
3. Check file size (must be < 10MB)
4. Verify file type is accepted

### Files Not Downloading
1. Check if backend static file serving is working: `http://localhost:5000/uploads/assignments/{filename}`
2. Verify file exists in `uploads/assignments` folder
3. Check browser console for CORS errors

### Assignment Not Appearing for Students
1. Verify student grade matches course grade
2. Check assignment status is 'active'
3. Refresh page or check real-time socket connection
4. Check browser console for API errors

### Real-time Updates Not Working
1. Check Socket.IO connection in browser console
2. Verify backend emits `assignmentCreated` event
3. Check if student is on Assignments module

## Security Notes
- Only authenticated teachers can upload files
- File type validation on backend
- File size limits enforced
- Unique filenames prevent overwriting
- Only students with matching grade can view assignments

## Future Enhancements
- File upload progress bar
- Drag-and-drop file upload
- Preview uploaded files before submit
- Delete uploaded files before assignment creation
- Assignment editing with file management
- Submission file uploads for students
