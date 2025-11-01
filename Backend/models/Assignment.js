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
  // Grade and section for targeting students
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'All'],
    default: 'All'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  totalMarks: {
    type: Number,
    default: 100,
    min: 1
  },
  attachments: [{
    name: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
assignmentSchema.index({ grade: 1, section: 1, status: 1 });
assignmentSchema.index({ teacherId: 1 });

// Virtual to check if overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status === 'active';
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
