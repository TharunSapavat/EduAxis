import { FileText } from 'lucide-react';

export default function StudentAssignments({ 
  assignments, 
  assignmentsLoading, 
  showNotification 
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Assignments</h1>
      {assignmentsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No assignments at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date();
            const isPending = assignment.status === 'active' || assignment.status === 'pending';
            
            return (
              <div key={assignment._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {assignment.courseId?.name || assignment.subject} • 
                      Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {assignment.totalMarks && ` • ${assignment.totalMarks} marks`}
                    </p>
                    {assignment.description && (
                      <p className="text-sm text-slate-700 mt-2">{assignment.description}</p>
                    )}
                    {assignment.teacherId?.name && (
                      <p className="text-xs text-slate-500 mt-2">By: {assignment.teacherId.name}</p>
                    )}
                    {assignment.attachments?.length > 0 && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-2">📎 Attachments:</p>
                        <ul className="space-y-1">
                          {assignment.attachments.map((att, idx) => {
                            const fileUrl = att.path 
                              ? `http://localhost:5000${att.path}` 
                              : att.url;
                            const fileName = att.name || `Attachment ${idx + 1}`;
                            const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                            
                            return (
                              <li key={idx}>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>{fileName}{fileSize}</span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-4 ${
                    isOverdue && isPending
                      ? 'bg-red-100 text-red-700'
                      : isPending
                      ? 'bg-orange-100 text-orange-700'
                      : assignment.status === 'graded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isOverdue && isPending ? 'Overdue' : assignment.status || 'Pending'}
                  </span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => showNotification('Assignment submission feature coming soon!', 'info')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {isPending ? 'Submit' : 'View Submission'}
                  </button>
                  <button 
                    onClick={() => showNotification('Assignment details coming soon!', 'info')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
