const express = require('express');
const router = express.Router();
const { getUsers, getStats, updateUserStatus } = require('../Controllers/AdminControllers');
const auth = require('../Middleware/Auth');
const adminAuth = require('../Middleware/AdminAuth');

// Apply both auth middlewares
router.use(auth, adminAuth);

router.get('/users', getUsers);
router.get('/stats', getStats);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;