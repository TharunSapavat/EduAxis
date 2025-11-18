import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { Trash2 } from 'lucide-react';

export default function TeacherAnnouncementsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAnnouncements();
      setItems(response.data.announcements || []);
    } catch (e) {
      console.error('Failed to load announcements', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('announcement-created', handler);
    return () => window.removeEventListener('announcement-created', handler);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setDeleting(id);
      await teacherAPI.deleteAnnouncement(id);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error('Failed to delete announcement', e);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="text-slate-600">Loading announcements…</div>;
  if (!items.length) return <div className="text-slate-600 text-sm">Your posted announcements will appear here.</div>;

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a._id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-slate-900 truncate">{a.title}</p>
                {a.courseId && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0">
                    {a.courseId.name} • Grade {a.courseId.grade}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${
                  a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  a.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  a.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {a.priority?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(a.createdAt).toLocaleDateString()} at {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(a._id)}
              disabled={deleting === a._id}
              className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete announcement"
            >
              {deleting === a._id ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
