const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user exists and has admin role
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = adminAuth;