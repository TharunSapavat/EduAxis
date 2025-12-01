import React from 'react';
import { IndianRupee, X } from 'lucide-react';

const StudentFees = ({ 
  fees, 
  feesLoading, 
  payments,
  feeSummary,
  showPaymentForm,
  setShowPaymentForm,
  selectedFee,
  setSelectedFee,
  paymentFormData,
  setPaymentFormData,
  handlePaymentSubmit,
  handleDownloadReceipt
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Fee Management</h1>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Total Fees</p>
          <p className="text-2xl font-bold text-slate-900">₹{feeSummary.totalFees?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">₹{feeSummary.totalPaid?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">₹{feeSummary.pending?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Late Fee</p>
          <p className="text-2xl font-bold text-orange-600">₹{feeSummary.lateFee?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Total Due</p>
          <p className="text-2xl font-bold text-blue-600">₹{feeSummary.totalDue?.toLocaleString() || 0}</p>
        </div>
      </div>
      
      {/* Active Fees */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Active Fees</h2>
        {feesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-2">Loading fees...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
            <IndianRupee className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No active fees at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fees.map((fee) => {
              const isPaid = payments.some(p => p.feeId === fee._id && p.status === 'completed');
              const isOverdue = new Date(fee.dueDate) < new Date() && !isPaid;
              
              return (
                <div key={fee._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{fee.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{fee.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isPaid 
                        ? 'bg-green-100 text-green-700' 
                        : isOverdue 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-bold text-slate-900">₹{fee.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Due Date:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {fee.semester && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Semester:</span>
                        <span className="font-medium text-slate-900">{fee.semester}</span>
                      </div>
                    )}
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setSelectedFee(fee);
                        setShowPaymentForm(true);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
            <p className="text-slate-600">No payment history</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {payment.receiptNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {payment.feeTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDownloadReceipt(payment._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && (() => {
        // Calculate late fee
        const now = new Date();
        const dueDate = new Date(selectedFee.dueDate);
        let lateFee = 0;
        let daysLate = 0;
        
        if (now > dueDate) {
          daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          lateFee = daysLate * 10; // ₹10 per day
        }
        
        const totalAmount = selectedFee.amount + lateFee;
        
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Make Payment</h2>
                  <button
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedFee(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-3">{selectedFee.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fee Amount:</span>
                      <span className="font-bold">₹{selectedFee.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Due Date:</span>
                      <span className={daysLate > 0 ? 'text-red-600 font-medium' : ''}>
                        {new Date(selectedFee.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {lateFee > 0 && (
                      <>
                        <div className="flex justify-between text-red-600">
                          <span>Late Fee ({daysLate} days × ₹10):</span>
                          <span className="font-bold">₹{lateFee?.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-300 flex justify-between">
                          <span className="text-slate-900 font-bold">Total Amount:</span>
                          <span className="font-bold text-blue-600 text-lg">₹{totalAmount?.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Payment">Online Payment</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.transactionId}
                    onChange={(e) => setPaymentFormData({...paymentFormData, transactionId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter transaction ID if applicable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={paymentFormData.remarks}
                    onChange={(e) => setPaymentFormData({...paymentFormData, remarks: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Any additional notes"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedFee(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={feesLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feesLoading ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default StudentFees;
