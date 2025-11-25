import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FileText, ListChecks, X } from 'lucide-react';

export default function TeacherAssignmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const socket = useSocket();
  const { user } = useAuth();

  const load = async () => {
    try {
      setLoading(true);
      const res = await teacherAPI.getAssignments();
      setItems(res.data.assignments || []);
    } catch (e) {
      console.error('Failed to load assignments', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Remove the old window event listener
    // const handler = () => load();
    // window.addEventListener('assignment-created', handler);
    // return () => window.removeEventListener('assignment-created', handler);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewAssignment = (data) => {
      // The teacher who created the assignment is the one who should see it updated.
      // The backend `createAssignment` controller action includes the teacherId on the assignment model.
      // We can check if the current user is the one who created it.
      if (data?.assignment?.teacherId === user?.id) {
        // Add the new assignment to the top of the list
        setItems(prevItems => [data.assignment, ...prevItems]);
      }
    };

    socket.on('assignmentCreated', handleNewAssignment);

    return () => {
      socket.off('assignmentCreated', handleNewAssignment);
    };
  }, [socket, user]);

  if (loading) return <div className="text-slate-600">Loading assignments…</div>;
  if (!items.length) return <div className="text-slate-600">No assignments yet.</div>;

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a._id} className="p-4 border border-slate-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-600">{a.courseId?.name || a.subject} • Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'} • {a.totalMarks || 100} marks</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">{a.status?.toUpperCase() || 'ACTIVE'}</span>
          </div>
          {Array.isArray(a.attachments) && a.attachments.length > 0 && (
            <div className="mt-2 text-sm bg-slate-50 p-2 rounded">
              <p className="text-slate-700 font-medium mb-1">📎 Attachments ({a.attachments.length}):</p>
              <ul className="space-y-1">
                {a.attachments.map((att, i) => {
                  const fileUrl = att.path ? `http://localhost:5000${att.path}` : att.url;
                  const fileName = att.name || `Attachment ${i + 1}`;
                  const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                  return (
                    <li key={i}>
                      <a className="text-blue-600 hover:underline inline-flex items-center gap-1" href={fileUrl} target="_blank" rel="noreferrer" download>
                        <FileText className="w-3 h-3" />
                        {fileName}{fileSize}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="mt-3">
            <button
              onClick={async () => {
                try {
                  setSelectedAssignment(a);
                  const res = await teacherAPI.getSubmissions(a._id);
                  setSubmissions(res.data.submissions || []);
                  setShowModal(true);
                } catch (e) {
                  console.error('Failed to load submissions', e);
                  setSubmissions([]);
                  setShowModal(true);
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
            >
              <ListChecks className="w-4 h-4" />
              View Submissions
            </button>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submissions • {selectedAssignment?.title}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-auto">
              {!submissions.length ? (
                <p className="text-slate-600">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div key={s._id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      {/* Student Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-base">{s.studentId?.name || 'Student'}</p>
                          <p className="text-xs text-slate-500">
                            Student ID: {s.studentId?.studentId || '—'} • Grade {s.studentId?.grade || '—'} • 
                            Submitted: {new Date(s.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Submission Content */}
                      <div className="space-y-3 mb-4">
                        <div className="bg-slate-100 p-3 rounded-lg">
                          <p className="text-xs font-bold text-slate-900 mb-2">📝 SUBMISSION DETAILS:</p>
                          
                          {s.content && s.content.trim() !== '' ? (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Submission Text:</p>
                              <div className="bg-white border border-slate-300 rounded p-3 text-sm text-slate-800 whitespace-pre-wrap">
                                {s.content}
                              </div>
                            </div>
                          ) : null}
                          
                          {s.comments && s.comments.trim() !== '' ? (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Student Comments:</p>
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-slate-700">
                                {s.comments}
                              </div>
                            </div>
                          ) : null}
                          
                          {((Array.isArray(s.files) && s.files.length > 0) || (Array.isArray(s.attachments) && s.attachments.length > 0)) ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">📎 Attached Files:</p>
                              <ul className="space-y-2 bg-white p-2 rounded border border-slate-300">
                                {(s.files || s.attachments || []).map((att, i) => {
                                  const fileUrl = att.path ? `http://localhost:5000${att.path}` : att.url;
                                  const fileName = att.name || att.filename || `Attachment ${i + 1}`;
                                  const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                                  return (
                                    <li key={i} className="flex items-center gap-2">
                                      {fileUrl ? (
                                        <a href={fileUrl} target="_blank" rel="noreferrer" download className="text-blue-600 hover:underline inline-flex items-center gap-2 p-2 hover:bg-blue-50 rounded flex-grow">
                                          <FileText className="w-4 h-4" />
                                          <span className="font-medium">{fileName}</span>
                                          <span className="text-xs text-slate-500">{fileSize}</span>
                                        </a>
                                      ) : (
                                        <span className="flex items-center gap-2 p-2">
                                          <FileText className="w-4 h-4" />
                                          {fileName}{fileSize}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                          
                          {!s.content && !s.comments && (!s.files || s.files.length === 0) && (!s.attachments || s.attachments.length === 0) && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                              ⚠️ No submission content found. The student may have submitted without adding any text or files.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Grading Section */}
                      {s.status === 'graded' && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-green-900">Grade: {s.marks} / {selectedAssignment?.totalMarks || 100}</p>
                              {s.feedback && <p className="text-xs text-green-700 mt-1">{s.feedback}</p>}
                            </div>
                            <span className="text-xs text-green-600">Graded on {new Date(s.gradedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      {s.status !== 'graded' && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded">
                          <p className="text-sm font-medium text-slate-700 mb-2">Grade this submission:</p>
                          <div className="flex gap-2 items-start">
                            <div className="flex-shrink-0">
                              <label className="block text-xs text-slate-600 mb-1">Marks</label>
                              <input
                                type="number"
                                min="0"
                                max={selectedAssignment?.totalMarks || 100}
                                placeholder="0"
                                id={`marks-${s._id}`}
                                className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex-grow">
                              <label className="block text-xs text-slate-600 mb-1">Feedback (optional)</label>
                              <textarea
                                id={`feedback-${s._id}`}
                                rows="2"
                                placeholder="Add feedback for the student..."
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const marks = document.getElementById(`marks-${s._id}`).value;
                                  const feedback = document.getElementById(`feedback-${s._id}`).value;
                                  
                                  if (!marks || marks === '') {
                                    alert('Please enter marks');
                                    return;
                                  }
                                  
                                  await teacherAPI.submitGrades({
                                    assignmentId: s.assignmentId,
                                    studentId: s.studentId._id,
                                    marks: parseFloat(marks),
                                    feedback: feedback || ''
                                  });
                                  
                                  // Refresh submissions
                                  const res = await teacherAPI.getSubmissions(selectedAssignment._id);
                                  setSubmissions(res.data.submissions || []);
                                } catch (e) {
                                  console.error('Failed to submit grade', e);
                                  alert('Failed to submit grade: ' + (e.response?.data?.message || e.message));
                                }
                              }}
                              className="mt-5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                            >
                              Submit Grade
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
