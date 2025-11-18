import React, { useMemo, useState } from 'react';
import { Library, BookOpen, Download, Search, X } from 'lucide-react';

const StudentLibrary = ({ library, libraryLoading, onSearch }) => {
  const [query, setQuery] = useState('');
  const categories = useMemo(() => {
    const set = new Set();
    (library?.availableResources || []).forEach(r => { if (r.category) set.add(r.category); });
    return ['All', ...Array.from(set).sort()];
  }, [library]);
  const [category, setCategory] = useState('All');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({
      search: query || undefined,
      category: category && category !== 'All' ? category : undefined,
    });
  };

  const handleClear = () => {
    setQuery('');
    setCategory('All');
    onSearch?.({});
  };
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Library Resources</h1>
      {/* Search & Filters */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-slate-100 p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, description, tags"
            className="w-full outline-none"
          />
        </div>
        <div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg bg-white">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Apply</button>
          <button type="button" onClick={handleClear} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm inline-flex items-center gap-1">
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
      </form>
      {libraryLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading library...</p>
        </div>
      ) : !library ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Library className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Library resources not available</p>
        </div>
      ) : (
        <div>
          {/* Library Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Available Resources</p>
              <p className="text-2xl font-bold text-blue-600">{library.availableResources?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Categories</p>
              <p className="text-2xl font-bold text-green-600">{categories.length - 1}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Free Access</p>
              <p className="text-2xl font-bold text-purple-600">24/7</p>
            </div>
          </div>

          {/* Available Resources */}
          {library.availableResources && library.availableResources.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Available Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.availableResources.map((resource) => (
                  <div key={resource._id} className="bg-white rounded-lg shadow-md p-4 border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-10 h-10 text-blue-600 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{resource.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{resource.author}</p>
                        {resource.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {resource.category}
                          </span>
                        )}
                        {resource.available !== undefined && (
                          <p className="text-xs text-slate-500 mt-2">
                            {resource.available} available
                          </p>
                        )}
                      </div>
                    </div>
                    {resource.downloadUrl && (
                      <a
                        href={resource.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLibrary;
