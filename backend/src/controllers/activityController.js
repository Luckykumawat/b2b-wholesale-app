const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs for the logged-in admin
// @route   GET /api/activity
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ adminId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an activity log (for client-side triggered actions like downloads/shares)
// @route   POST /api/activity
// @access  Private/Admin
const createActivityLog = async (req, res) => {
  try {
    const { action, details, meta } = req.body;
    const log = await ActivityLog.create({
      adminId: req.user._id,
      action,
      details: details || '',
      meta: meta || {},
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: log an action server-side (called directly from other controllers)
const logActivity = async (adminId, action, details = '', meta = {}) => {
  try {
    await ActivityLog.create({ adminId, action, details, meta });
  } catch (err) {
    console.error('ActivityLog error:', err.message);
  }
};

module.exports = { getActivityLogs, createActivityLog, logActivity };
