import React from 'react';
import { Library, BookOpen, Download } from 'lucide-react';

const StudentLibrary = ({ library, libraryLoading }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Library Resources</h1>
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
              <p className="text-sm text-slate-600 mb-1">Borrowed Books</p>
              <p className="text-2xl font-bold text-orange-600">{library.borrowedBooks?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Overdue Items</p>
              <p className="text-2xl font-bold text-red-600">{library.overdueItems || 0}</p>
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
                      <BookOpen className="w-10 h-10 text-blue-600 flex-shrink-0" />
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

          {/* Borrowed Books */}
          {library.borrowedBooks && library.borrowedBooks.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Borrowed Books</h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Book</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Borrowed On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {library.borrowedBooks.map((book) => {
                      const dueDate = new Date(book.dueDate);
                      const isOverdue = dueDate < new Date();
                      
                      return (
                        <tr key={book._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <div>
                              <p className="font-medium">{book.title}</p>
                              {book.author && (
                                <p className="text-slate-600 text-xs">{book.author}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(book.borrowedOn).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {dueDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Active'}
                            </span>
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
      )}
    </div>
  );
};

export default StudentLibrary;
