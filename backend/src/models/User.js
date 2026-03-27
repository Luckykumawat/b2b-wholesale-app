const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'buyer', 'superadmin'], default: 'buyer' },
    phone: String,
    companyName: String,
    state: String,
    district: String,
    country: String,
    companyDetails: {
      name: String,
      address: String,
      logo: String,
    },
    customPricingTier: { type: Number, default: 1 }, // Multiplier for custom pricing
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
