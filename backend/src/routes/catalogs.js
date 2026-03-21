const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get public catalog for a specific buyer
// @route   GET /api/catalogs/shared/:buyerId
// @access  Public
router.get('/:buyerId', async (req, res) => {
  try {
    const buyer = await User.findById(req.params.buyerId);
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query);
    const customizedProducts = products.map(p => ({
      ...p.toObject(),
      customPrice: p.basePrice * (buyer.customPricingTier || 1)
    }));

    res.json({
      buyerCompany: buyer.companyDetails?.name || buyer.name,
      products: customizedProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
