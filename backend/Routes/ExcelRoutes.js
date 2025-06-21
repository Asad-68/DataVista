const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadExcel, 
  analyzeExcel, 
  getFiles, 
  getStats, 
  generateInsights 
} = require('../Controllers/ExcelControllers');
const auth = require('../Middleware/Auth');
const fs = require('fs/promises');
const path = require('path');
const File = require('../Models/File');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes with auth middleware
router.post('/upload', auth, upload.single('file'), uploadExcel);
router.get('/files', auth, getFiles);
router.post('/analyze', auth, analyzeExcel);
router.get('/stats', auth, getStats);
router.post('/track-analysis', auth, async (req, res) => {
  try {
    const { filename, analysis } = req.body;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const file = await File.findOne({ filename, user: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.analyses.push({
      chartType: analysis.chartType,
      xAxis: analysis.xAxis,
      yAxis: analysis.yAxis,
      createdAt: new Date()
    });

    await file.save();
    
    res.json({
      message: 'Analysis tracked successfully',
      analysesCount: file.analyses.length
    });
  } catch (error) {
    console.error('Track analysis error:', error);
    res.status(500).json({ message: error.message });
  }
});

// AI Insights route
router.post('/generate-insights', auth, generateInsights);

module.exports = router;