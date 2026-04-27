const supabase = require('../config/supabase');

const mapActivityLog = (row) => ({
  _id: row.id,
  id: row.id,
  adminId: row.admin_id,
  action: row.action,
  details: row.details || '',
  meta: row.meta || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// @desc    Get activity logs for the logged-in admin
// @route   GET /api/activity
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('admin_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    res.json((data || []).map(mapActivityLog));
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
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          admin_id: req.user._id,
          action,
          details: details || '',
          meta: meta || {},
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(mapActivityLog(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: log an action server-side (called directly from other controllers)
const logActivity = async (adminId, action, details = '', meta = {}) => {
  try {
    const { error } = await supabase.from('activity_logs').insert([
      {
        admin_id: adminId,
        action,
        details,
        meta,
      },
    ]);
    if (error) throw error;
  } catch (err) {
    console.error('ActivityLog error:', err.message);
  }
};

module.exports = { getActivityLogs, createActivityLog, logActivity };
