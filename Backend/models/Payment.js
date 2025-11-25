import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  feeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: [true, 'Fee ID is required']
  },
  feeTitle: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Online Payment', 'Check', 'UPI', 'Other'],
    default: 'Cash'
  },
  transactionId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Auto-generate receipt number
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.receiptNumber) {
    this.receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
