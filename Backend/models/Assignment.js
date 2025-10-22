import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long']
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded'],
    default: 'pending'
  },
  marks: {
    type: Number,
    min: 0
  },
  totalMarks: {
    type: Number,
    default: 100,
    min: 1
  },
  submittedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
assignmentSchema.index({ studentId: 1 });
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ status: 1 });

// Virtual to check if overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status === 'pending';
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
