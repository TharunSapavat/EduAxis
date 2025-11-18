import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { FileText, ListChecks, X } from 'lucide-react';

export default function TeacherAssignmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

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
    const handler = () => load();
    window.addEventListener('assignment-created', handler);
    return () => window.removeEventListener('assignment-created', handler);
  }, []);

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
                    <div key={s._id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{s.studentId?.name || 'Student'}</p>
                          <p className="text-xs text-slate-600">ID: {s.studentId?.studentId || '—'} • {new Date(s.submittedAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${s.status === 'graded' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{s.status}</span>
                      </div>
                      {s.content && (
                        <div className="bg-slate-50 border border-slate-200 rounded mt-2 p-2 text-sm text-slate-800 whitespace-pre-wrap">
                          {s.content}
                        </div>
                      )}
                      {Array.isArray(s.attachments) && s.attachments.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium text-slate-800">Attachments:</p>
                          <ul className="list-disc ml-6">
                            {s.attachments.map((att, i) => {
                              const fileUrl = att.path ? `http://localhost:5000${att.path}` : att.url;
                              const fileName = att.name || `Attachment ${i + 1}`;
                              return (
                                <li key={i}>
                                  {fileUrl ? (
                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{fileName}</a>
                                  ) : (
                                    <span>{fileName}</span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
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
