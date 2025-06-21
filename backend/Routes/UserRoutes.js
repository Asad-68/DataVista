const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  updateSettings, 
  getSettings,
  createAdmin 
} = require('../Controllers/UserControllers.js');
const auth = require('../Middleware/Auth');

router.post('/register', register);
router.post('/login', login);
router.post('/settings', auth, updateSettings);
router.get('/settings', auth, getSettings);
router.post('/create-admin', createAdmin); // Add this line

module.exports = router;