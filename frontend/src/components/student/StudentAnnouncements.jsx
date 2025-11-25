import React from 'react';
import { Bell } from 'lucide-react';

const StudentAnnouncements = ({ announcements, announcementsLoading }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Announcements</h1>
      {announcementsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No announcements at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement._id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-slate-700 mt-3">{announcement.content}</p>
                  {announcement.author && (
                    <p className="text-xs text-slate-500 mt-3">
                      By: {announcement.author.name || 'Administration'}
                    </p>
                  )}
                </div>
                {announcement.priority === 'high' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 ml-4">
                    Important
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
