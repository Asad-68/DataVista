const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyses: [{
    chartType: {
      type: String,
      enum: ['line', 'bar', 'scatter', 'pie', 'bubble', 'radar'],
      required: true
    },
    xAxis: String,
    yAxis: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, { collection: 'files' });

module.exports = mongoose.model('File', fileSchema);