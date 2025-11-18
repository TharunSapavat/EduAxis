import React from 'react';
import { Calendar, X } from 'lucide-react';

const StudentLeave = ({ 
  leaveRequests, 
  leaveRequestsLoading, 
  showLeaveForm, 
  setShowLeaveForm,
  leaveFormData,
  setLeaveFormData,
  handleLeaveSubmit,
  leaveCurrentPage,
  setLeaveCurrentPage,
  leaveRequestsPerPage
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Leave Requests</h1>
        <button
          onClick={() => setShowLeaveForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Apply for Leave
        </button>
      </div>

      {leaveRequestsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading leave requests...</p>
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No leave requests yet</p>
          <p className="text-slate-500 text-sm mt-2">Click "Apply for Leave" to submit your first request</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {leaveRequests
              .slice((leaveCurrentPage - 1) * leaveRequestsPerPage, leaveCurrentPage * leaveRequestsPerPage)
              .map((req) => (
              <div key={req._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{req.type} Leave</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()} ({req.days} day{req.days > 1 ? 's' : ''})
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-2"><span className="font-medium">Reason:</span> {req.reason}</p>
                {req.reviewRemarks && (
                  <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded"><span className="font-medium">Admin Remarks:</span> {req.reviewRemarks}</p>
                )}
                <p className="text-xs text-slate-500 mt-3">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {leaveRequests.length > leaveRequestsPerPage && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-slate-100">
              <div className="text-sm text-slate-600">
                Showing {((leaveCurrentPage - 1) * leaveRequestsPerPage) + 1} to {Math.min(leaveCurrentPage * leaveRequestsPerPage, leaveRequests.length)} of {leaveRequests.length} requests
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeaveCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={leaveCurrentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    leaveCurrentPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(leaveRequests.length / leaveRequestsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setLeaveCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        leaveCurrentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setLeaveCurrentPage(prev => Math.min(prev + 1, Math.ceil(leaveRequests.length / leaveRequestsPerPage)))}
                  disabled={leaveCurrentPage === Math.ceil(leaveRequests.length / leaveRequestsPerPage)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    leaveCurrentPage === Math.ceil(leaveRequests.length / leaveRequestsPerPage)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Leave Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={leaveFormData.type}
                    onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="personal">Personal</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={leaveFormData.endDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={leaveFormData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                  <textarea
                    value={leaveFormData.reason}
                    onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                    rows="4"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why you need leave..."
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeave;
