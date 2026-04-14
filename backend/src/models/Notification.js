const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true },
    actorId: { type: String, required: true },
    type: { type: String, required: true }, // e.g. 'quotation_approved', 'quotation_confirmed', 'quotation_requested'
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // e.g. '/admin/quotes' or '/buyer/quotes'
  },
  { timestamps: true }
);

// We will fetch notifications by recipient
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
