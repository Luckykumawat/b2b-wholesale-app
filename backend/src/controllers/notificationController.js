const supabase = require('../config/supabase');

const mapNotification = (row) => ({
  _id: row.id,
  id: row.id,
  recipientId: row.recipient_id,
  actorId: row.actor_id,
  type: row.type,
  message: row.message,
  link: row.link || '',
  isRead: Boolean(row.is_read),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json((data || []).map(mapNotification));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark one or all notifications as read
// @route   PATCH /api/notifications/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', req.user._id);
      if (error) throw error;
    } else {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', req.user._id)
        .eq('is_read', false);
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal Helper method
const createNotification = async (recipientId, actorId, type, message, link = '') => {
  try {
    // Only create if recipient isn't the actor (though usually they aren't)
    if (String(recipientId) !== String(actorId)) {
      const { error } = await supabase.from('notifications').insert([
        {
          recipient_id: recipientId,
          actor_id: actorId,
          type,
          message,
          link,
          is_read: false,
        },
      ]);
      if (error) throw error;
    }
  } catch (err) {
    console.error('Failed to create notification', err.message);
  }
};

module.exports = { getNotifications, markAsRead, createNotification };
