import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Link as LinkIcon, X, Trash2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminLibraryManagement({ showNotification }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    category: 'General',
    tags: '',
    grade: 'All',
    linkUrl: '',
  });
  const [file, setFile] = useState(null);

  const categories = ['General', 'Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
  const grades = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getLibraryResources();
      setResources(res.data.resources || []);
    } catch (e) {
      console.error('Failed to load library resources', e);
      showNotification?.('Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification?.('Title is required', 'error');
      return;
    }

    try {
      setUploading(true);
      let res;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('author', formData.author);
        fd.append('category', formData.category);
        fd.append('tags', formData.tags);
        fd.append('grade', formData.grade);
        res = await adminAPI.createLibraryResource(fd);
      } else if (formData.linkUrl.trim()) {
        res = await adminAPI.createLibraryResource({
          ...formData,
          linkUrl: formData.linkUrl.trim(),
        });
      } else {
        showNotification?.('Please upload a file or provide a link', 'error');
        return;
      }

      if (res.data.success) {
        showNotification?.('Resource added successfully', 'success');
        setShowForm(false);
        setFormData({ title: '', description: '', author: '', category: 'General', tags: '', grade: 'All', linkUrl: '' });
        setFile(null);
        loadResources();
      }
    } catch (err) {
      console.error('Upload failed', err);
      showNotification?.(err.response?.data?.message || 'Failed to add resource', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await adminAPI.deleteLibraryResource(id);
      showNotification?.('Resource deleted', 'success');
      loadResources();
    } catch (e) {
      console.error('Delete failed', e);
      showNotification?.('Failed to delete resource', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Library Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No library resources yet</p>
          <p className="text-slate-500 text-sm mt-2">Click "Add Resource" to upload files or add links</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resources.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.title}</p>
                      {r.author && <p className="text-xs text-slate-600">{r.author}</p>}
                      {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.grade}</td>
                  <td className="px-6 py-4 text-sm">
                    {r.isExternal ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Link</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">File</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Resource Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900">Add Library Resource</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Resource title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Brief description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
                  <input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                  <input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="algebra, geometry"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Choose one option:</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File (PDF, images, docs, zip - max 10MB)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        setFile(e.target.files[0]);
                        if (e.target.files[0]) setFormData({ ...formData, linkUrl: '' });
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {file && <p className="text-xs text-slate-600 mt-1">{file.name}</p>}
                  </div>
                  <div className="text-center text-sm text-slate-500">— OR —</div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      External Link
                    </label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, linkUrl: e.target.value });
                        if (e.target.value) setFile(null);
                      }}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="https://example.com/resource.pdf"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
                >
                  {uploading ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
