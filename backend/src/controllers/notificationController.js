const Notification = require('../models/Notification');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
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
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: req.user._id },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { recipientId: req.user._id, isRead: false },
        { isRead: true }
      );
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
      await Notification.create({ recipientId, actorId, type, message, link });
    }
  } catch (err) {
    console.error('Failed to create notification', err.message);
  }
};

module.exports = { getNotifications, markAsRead, createNotification };
