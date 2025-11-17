import React from 'react';

const TeacherAttendance = ({ 
  teacherCourses, 
  coursesLoading, 
  attendanceCourseId, 
  setAttendanceCourseId, 
  attendanceLoading, 
  attendanceStudents, 
  attendanceMarking, 
  markAttendanceStatus 
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Mark Attendance</h1>
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
          <select
            value={attendanceCourseId}
            onChange={(e) => setAttendanceCourseId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          >
            {coursesLoading ? (
              <option>Loading courses...</option>
            ) : teacherCourses.length > 0 ? (
              teacherCourses.map(c => (
                <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
              ))
            ) : (
              <option>No courses assigned</option>
            )}
          </select>
        </div>
        {attendanceLoading ? (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-600">Loading students...</div>
        ) : attendanceStudents.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-600">No students found for this course.</div>
        ) : (
          <div className="space-y-3">
            {attendanceStudents.map((s, idx) => (
              <div key={s._id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-sm text-slate-600">ID: {s.studentId || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markAttendanceStatus(s._id || s.id, 'present')}
                    disabled={!!attendanceMarking[s._id || s.id]}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
                  >
                    Present
                  </button>
                  <button
                    onClick={() => markAttendanceStatus(s._id || s.id, 'absent')}
                    disabled={!!attendanceMarking[s._id || s.id]}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
