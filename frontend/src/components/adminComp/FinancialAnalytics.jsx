import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function FinancialAnalytics({ showNotification }) {
  const [paymentData, setPaymentData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPaymentStats();
      setPaymentData(res.data.data);

      // Generate trend data (would come from backend)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const trend = months.map((month, idx) => ({
        month,
        collected: Math.random() * 500000 + 300000,
        pending: Math.random() * 200000 + 100000
      }));
      setTrendData(trend);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      showNotification('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading financial data...</div>;
  }

  const collectionRate = paymentData
    ? ((paymentData.completed / paymentData.total) * 100).toFixed(1)
    : 0;

  const outstandingFees = paymentData
    ? (paymentData.totalAmount - (paymentData.totalAmount * (collectionRate / 100)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <p className="text-green-700 text-sm font-medium">Total Collected</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            ₹{(paymentData?.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-green-700 mt-2">{collectionRate}% collection rate</p>
        </div>

        <div className="bg-linear-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <p className="text-orange-700 text-sm font-medium">Outstanding</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">
            ₹{(outstandingFees).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-orange-700 mt-2">{((outstandingFees / paymentData?.totalAmount) * 100).toFixed(1)}% pending</p>
        </div>

        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <p className="text-blue-700 text-sm font-medium">Completed Payments</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{paymentData?.completed || 0}</p>
          <p className="text-sm text-blue-700 mt-2">of {paymentData?.total}</p>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <p className="text-purple-700 text-sm font-medium">Avg Collection</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">
            ₹{((paymentData?.totalAmount || 0) / Math.max(1, paymentData?.completed || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-purple-700 mt-2">per payment</p>
        </div>
      </div>

      {/* Collection Trend */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Collection Trend</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
            <Legend />
            <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} name="Collected" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-slate-900 mb-4">Payment Methods Distribution</h3>
        <div className="space-y-3">
          {[
            { method: 'Online Payment', count: 45, percentage: 45 },
            { method: 'Bank Transfer', count: 25, percentage: 25 },
            { method: 'Cash', count: 20, percentage: 20 },
            { method: 'Cheque', count: 10, percentage: 10 }
          ].map(pm => (
            <div key={pm.method}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{pm.method}</span>
                <span className="text-sm font-semibold text-slate-900">{pm.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${pm.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outstanding Fees Alert */}
      {outstandingFees > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Action Required</h3>
              <p className="text-red-800 mt-1">
                ₹{outstandingFees.toLocaleString('en-IN', { maximumFractionDigits: 0 })} in outstanding fees from {Math.ceil(paymentData?.total * 0.3)} students.
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium">
                Send Reminders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
