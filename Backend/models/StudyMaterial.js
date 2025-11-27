import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  grade: {
    type: Number,
    required: [true, 'Grade is required'],
    min: 1,
    max: 12
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
studyMaterialSchema.index({ grade: 1, uploadDate: -1 });
studyMaterialSchema.index({ uploadedBy: 1, uploadDate: -1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;
