import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [2, 'Course name must be at least 2 characters long']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Course code must be at least 3 characters long']
  },
  description: {
    type: String,
    trim: true
  },
  teacher: {
    type: String,
    default: 'TBD'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: {
    type: Number,
    default: 0,
    min: [0, 'Number of students cannot be negative']
  },
  credits: {
    type: Number,
    required: true,
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6'],
    default: 3
  },
  semester: {
    type: Number,
    min: 1,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
courseSchema.index({ teacherId: 1 });
courseSchema.index({ code: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
