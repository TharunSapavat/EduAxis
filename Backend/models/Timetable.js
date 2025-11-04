import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  // Target audience
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C', 'D', 'E']
  },
  
  // Academic details
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    default: 'Fall'
  },

  // Schedule entries
  schedule: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    room: {
      type: String,
      default: 'TBA'
    },
    type: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'activity', 'break'],
      default: 'lecture'
    }
  }],

  // Effective dates
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for quick lookups
timetableSchema.index({ grade: 1, section: 1, isActive: 1 });
timetableSchema.index({ academicYear: 1, semester: 1 });

// Virtual to get today's schedule
timetableSchema.methods.getTodaySchedule = function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  return this.schedule
    .filter(entry => entry.day === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// Method to get schedule for a specific day
timetableSchema.methods.getDaySchedule = function(day) {
  return this.schedule
    .filter(entry => entry.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;
