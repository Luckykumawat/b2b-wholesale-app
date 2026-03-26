const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema(
  {
    buyerCompany: {
      type: String,
      required: true,
    },
    buyerEmail: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      }
    ],
    linkToken: {
      type: String,
      required: true,
      unique: true,
    },
    customColumns: {
      type: [String],
      default: ['Image', 'Product ID', 'Variant ID', 'Category', 'Sub Category', 'Collection Name', 'Color', 'Material', 'Size (CM)', 'Product Name', 'Selling Price', 'Wood Finish'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Catalogue', catalogueSchema);
