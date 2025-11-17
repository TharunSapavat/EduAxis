import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { FileText } from 'lucide-react';

export default function TeacherAssignmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
        </div>
      ))}
    </div>
  );
}
