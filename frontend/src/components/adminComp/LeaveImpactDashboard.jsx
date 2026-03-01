import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Users, Clock } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function LeaveImpactDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getLeaveRequests({ status: 'all' });
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImpactSummary = (leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return {
      daysCount,
      affectedCourses: 3, // This would be calculated from the database
      studentsImpacted: 85,
      deadlinesMissed: 2
    };
  };

  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  if (loading) {
    return <div className="text-center py-12">Loading leave impact data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-slate-600 text-sm">Active Leaves</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{approvedLeaves.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-slate-600 text-sm">Pending Requests</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{pendingLeaves.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-slate-600 text-sm">Avg Impact</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">2.5</p>
          <p className="text-sm text-slate-500 mt-1">courses/leave</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-slate-600 text-sm">Students Affected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">285</p>
        </div>
      </div>

      {/* Active Leaves with Impact */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Active Leaves & Impact</h3>
        <div className="space-y-4">
          {approvedLeaves.length > 0 ? (
            approvedLeaves.map(leave => {
              const impact = getImpactSummary(leave);
              return (
                <div
                  key={leave._id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedLeave(leave)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{leave.teacherName}</h4>
                      <p className="text-sm text-slate-600">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    {impact.deadlinesMissed > 0 && (
                      <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">{impact.deadlinesMissed} deadlines</span>
                      </div>
                    )}
                  </div>

                  {/* Impact Breakdown */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{impact.daysCount}</p>
                      <p className="text-xs text-slate-600">Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{impact.affectedCourses}</p>
                      <p className="text-xs text-slate-600">Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{impact.studentsImpacted}</p>
                      <p className="text-xs text-slate-600">Students</p>
                    </div>
                  </div>

                  {/* Actions for Leave */}
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                      Assign Substitute
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No active leaves</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Leaves */}
      {pendingLeaves.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Pending Leave Requests</h3>
          <div className="space-y-2">
            {pendingLeaves.map(leave => (
              <div key={leave._id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{leave.teacherName}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
