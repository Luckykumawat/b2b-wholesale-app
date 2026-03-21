const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, unique: true, sparse: true },
    description: String,
    images: [{ type: String }], // Cloudinary URLs
    basePrice: { type: Number, required: true },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, default: 'cm' },
    },
    material: String,
    finish: String,
    cbm: Number,
    collectionName: String,
    stock: { type: Number, default: 0 },
    category: { type: String, required: true },
    tags: [{ type: String }], // For AI recommendations
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
