import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  applicantRole: {
    type: String,
    enum: ['teacher', 'student'],
    required: [true, 'Applicant role is required']
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'emergency', 'personal', 'other'],
    default: 'casual'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters long']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
leaveSchema.index({ applicant: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
