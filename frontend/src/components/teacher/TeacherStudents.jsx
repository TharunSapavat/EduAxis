import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const TeacherStudents = ({ 
  students, 
  studentsLoading, 
  courseForStudentView, 
  setCourseForStudentView, 
  setStudents 
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student List</h1>
          {courseForStudentView && (
            <p className="text-slate-600 mt-1">
              {courseForStudentView.name} • Grade {courseForStudentView.grade} • {courseForStudentView.code}
            </p>
          )}
        </div>
        {courseForStudentView && (
          <button
            onClick={() => {
              setCourseForStudentView(null);
              setStudents([]);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {studentsLoading ? (
        <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Students Found</h3>
          <p className="text-slate-600 mb-6">
            {courseForStudentView 
              ? `No students are enrolled in ${courseForStudentView.name} (Grade ${courseForStudentView.grade}).`
              : 'Select a course from "My Courses" to view enrolled students.'}
          </p>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            View My Courses
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          {/* Stats Header */}
          <div className="bg-linear-to-r from-green-600 to-green-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Total Enrolled Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student, index) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-700 font-semibold text-sm">
                            {student.name?.charAt(0).toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {student.studentId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Grade {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this course
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
