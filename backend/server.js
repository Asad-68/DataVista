require('dotenv').config(); // Move this to the very top
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./Routes/UserRoutes');
const excelRoutes = require('./Routes/ExcelRoutes');
const adminRoutes = require('./Routes/AdminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Excel Analytics API is running');
});

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/admin', adminRoutes); // Add this line to mount Admin routes

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});