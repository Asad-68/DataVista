const User = require('../Models/User'); // Change path to use capital M
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }

    // If admin code is provided but incorrect, return error
    if (adminCode && adminCode !== process.env.ADMIN_SECRET) {
      return res.status(400).json({
        message: 'Invalid admin code'
      });
    }

    // Create new user with role
    const user = new User({
      username,
      email,
      password,
      role: adminCode === process.env.ADMIN_SECRET ? 'admin' : 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check for admin login attempt
    if (adminCode) {
      if (adminCode !== process.env.ADMIN_SECRET || user.role !== 'admin') {
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ 
      settings: {
        notifications: user.settings?.notifications ?? true
      } 
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { notifications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { 
        $set: { 
          'settings.notifications': notifications 
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Settings updated successfully', 
      settings: user.settings 
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add this new function
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;
    
    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      role: 'admin'
    });

    await user.save();
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};