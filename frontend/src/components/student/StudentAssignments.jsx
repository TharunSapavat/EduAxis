import { FileText, X } from 'lucide-react';
import { useState } from 'react';
import { studentAPI } from '../../services/api';

export default function StudentAssignments({ 
  assignments, 
  assignmentsLoading, 
  showNotification 
}) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [recentlySubmitted, setRecentlySubmitted] = useState({});
  const [files, setFiles] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  const openSubmit = (assignment) => {
    setActiveAssignment(assignment);
    setSubmitContent('');
    setSubmitLink('');
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e?.preventDefault();
    if (!activeAssignment?._id) return;
    setSubmitting(true);
    try {
      let res;
      if (files && files.length > 0) {
        const fd = new FormData();
        fd.append('assignmentId', activeAssignment._id);
        if (submitContent?.trim()) fd.append('content', submitContent.trim());
        if (submitLink?.trim()) fd.append('link', submitLink.trim());
        Array.from(files).forEach((f) => fd.append('files', f));
        res = await studentAPI.submitAssignment(fd);
      } else {
        const payload = {
          assignmentId: activeAssignment._id,
          content: submitContent?.trim() || undefined,
          link: submitLink?.trim() || undefined,
        };
        res = await studentAPI.submitAssignment(payload);
      }
      if (res.data?.success) {
        showNotification(res.data.message || 'Submitted successfully', 'success');
        setRecentlySubmitted((prev) => ({ ...prev, [activeAssignment._id]: true }));
        setShowSubmitModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      showNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewSubmission = async (assignment) => {
    try {
      setActiveAssignment(assignment);
      const res = await studentAPI.getSubmissionDetails(assignment._id);
      if (res.data?.success) {
        setSubmissionDetails(res.data.submission);
        setShowViewModal(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No submission found yet';
      showNotification(msg, 'info');
    }
  };

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
                  {isPending && !recentlySubmitted[assignment._id] ? (
                    <button
                      onClick={() => openSubmit(assignment)}
                      disabled={isOverdue}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                        isOverdue ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isOverdue ? 'Closed' : 'Submit'}
                    </button>
                  ) : (
                    <button
                      onClick={() => openViewSubmission(assignment)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      View Submission
                    </button>
                  )}
                  <button
                    onClick={() => openViewSubmission(assignment)}
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

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submit Assignment</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4">
              <div>
                <p className="text-sm text-slate-600">{activeAssignment?.title}</p>
                <p className="text-xs text-slate-500">{activeAssignment?.courseId?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Submission Text</label>
                <textarea value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} rows={5} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Write your answer or notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Optional Link (Google Doc, GitHub, etc.)</label>
                <input type="url" value={submitLink} onChange={(e) => setSubmitLink(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attachments (max 5, up to 10MB each)</label>
                <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="block w-full text-sm text-slate-700" />
                <p className="text-xs text-slate-500 mt-1">Allowed: PDF, Word, PPT, Excel, images, text, zip</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submission Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!submissionDetails ? (
                <p className="text-slate-600">No submission found.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Assignment:</span> {submissionDetails.assignmentId?.title}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Status:</span> {submissionDetails.status}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Submitted At:</span> {new Date(submissionDetails.submittedAt).toLocaleString()}</p>
                  {submissionDetails.marks != null && (
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Marks:</span> {submissionDetails.marks}/{submissionDetails.assignmentId?.totalMarks ?? '-'}</p>
                  )}
                  {submissionDetails.feedback && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      <span className="font-semibold">Feedback:</span> {submissionDetails.feedback}
                    </div>
                  )}
                  {submissionDetails.content && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-wrap">
                      {submissionDetails.content}
                    </div>
                  )}
                  {submissionDetails.attachments?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-slate-800">Attachments:</p>
                      <ul className="list-disc ml-6 text-sm">
                        {submissionDetails.attachments.map((att, idx) => (
                          <li key={idx}>
                            {att.url ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{att.name || att.url}</a>
                            ) : (
                              <span>{att.name || 'Attachment'}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
