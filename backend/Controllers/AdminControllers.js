const User = require('../Models/User');
const File = require('../Models/File');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'user',
          as: 'files'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          isActive: 1,
          filesCount: { $size: '$files' },
          totalStorage: { 
            $sum: '$files.size' 
          }
        }
      }
    ]);
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalFiles = await File.countDocuments();
    
    // Get most used chart types with error handling
    const chartStats = await File.aggregate([
      { $match: { analyses: { $exists: true, $ne: [] } } },
      { $unwind: '$analyses' },
      {
        $group: {
          _id: '$analyses.chartType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).exec() || [];

    // Get storage statistics with error handling
    const storageStats = await File.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$size' },
          averageFileSize: { $avg: '$size' }
        }
      }
    ]).exec() || [{ totalStorage: 0, averageFileSize: 0 }];

    // Get user activity with error handling
    const recentActivity = await File.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { uploadedAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          filename: 1,
          uploadedAt: 1,
          username: '$userDetails.username',
          analyses: { 
            $cond: {
              if: { $isArray: "$analyses" },
              then: { $size: "$analyses" },
              else: 0
            }
          }
        }
      }
    ]).exec() || [];
    
    res.json({
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        inactive: (totalUsers - activeUsers) || 0
      },
      files: {
        total: totalFiles || 0,
        totalStorage: storageStats[0]?.totalStorage || 0,
        averageFileSize: storageStats[0]?.averageFileSize || 0
      },
      chartUsage: chartStats,
      recentActivity
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch admin statistics',
      error: error.message 
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};