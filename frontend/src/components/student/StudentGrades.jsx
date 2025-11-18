import React from 'react';
import { BarChart3 } from 'lucide-react';

const StudentGrades = ({ grades, gradesLoading }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Grades</h1>
      {gradesLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading grades...</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No grades available yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Assignment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Marks</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Grade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {grades.map((grade) => {
                  const percentage = (grade.marks / grade.totalMarks) * 100;
                  const gradeColor = 
                    percentage >= 90 ? 'text-green-700 bg-green-100' :
                    percentage >= 75 ? 'text-blue-700 bg-blue-100' :
                    percentage >= 60 ? 'text-orange-700 bg-orange-100' :
                    'text-red-700 bg-red-100';
                  
                  return (
                    <tr key={grade._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {grade.courseId?.name || grade.course || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {grade.assignmentId?.title || grade.assignment || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {grade.marks}/{grade.totalMarks}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${gradeColor}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(grade.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
