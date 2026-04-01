const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'product_add',
        'product_update',
        'product_delete',
        'product_bulk_delete',
        'product_bulk_import',
        'catalogue_create',
        'catalogue_delete',
        'catalogue_share',
        'buyer_create',
        'file_download',
        'label_create',
        'label_download',
      ],
    },
    details: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
