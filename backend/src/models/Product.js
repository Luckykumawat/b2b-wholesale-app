const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // ── Core / Required ──────────────────────────────────────────────────────
    name: { type: String, required: true }, // Product Name
    sku: { type: String, unique: true, sparse: true }, // Product ID
    category: { type: String, required: true }, // Category
    sellingPrice: { type: Number, required: true }, // Selling Price

    // ── Classification ───────────────────────────────────────────────────────
    variantId: String, // Variant ID
    subCategory: String, // Sub Category
    productTag: String, // Product Tag (General tag string)
    tags: [{ type: String }], // Internal recommendation tags (array)
    collectionName: String, // Collection Name
    theme: String, // Theme
    season: String, // Season
    searchKeywords: String, // Search keywords

    // ── Pricing & Costs ──────────────────────────────────────────────────────
    sellingPrice_Currency: { type: String, default: 'USD' },
    sellingPrice_Unit: String, // Selling Price_Unit (e.g., Per Piece)
    
    productCost: Number, // Product Cost
    productCost_Currency: String,
    productCost_Unit: String,

    vendorPrice: Number, // Price from Vendor
    vendorPrice_Currency: String,
    vendorPrice_Unit: String,

    // ── Inventory / Logistics ────────────────────────────────────────────────
    stock: { type: Number, default: 0 },
    moq: { type: Number, default: 1 }, // MOQ
    samplingTime: String, // Sampling Time
    productionTime: String, // Production Time
    
    // Container Loadability
    ft20: String, // 20'ft
    ft40HC: String, // Loadability (40'ft HC)
    ft40GP: String, // 40'ft GP
    
    // ── Physical Attributes ──────────────────────────────────────────────────
    sizeCM: String, // Size (CM) - Free text size description
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, default: 'cm' },
    },
    cbm: Number, // CBM
    color: String,
    material: String,
    metalFinish: String,
    woodFinish: String,
    assembledKD: String, // Assembled/KD
    
    // ── Production / Vendor ──────────────────────────────────────────────────
    vendorName: String, // Vendor Name
    productionTechnique: String, // Production Technique
    exclusiveFor: String, // Exclusive For
    countryOfOrigin: String,
    
    // ── Content / Media ──────────────────────────────────────────────────────
    description: String,
    remarks: String, // Remarks
    variationHinge: String, // Variation_hinge
    images: [{ type: String }], // Image URL(s)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
