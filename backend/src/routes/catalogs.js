const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const productService = require('../services/productService');

// @desc    Get public catalog for a specific buyer
// @route   GET /api/catalogs/shared/:buyerId
// @access  Public
router.get('/:buyerId', async (req, res) => {
  try {
    const { data: buyer, error: buyerError } = await supabase
      .from('users')
      .select('id,name,role,custom_pricing_tier,company_name,assigned_admin')
      .eq('id', req.params.buyerId)
      .maybeSingle();

    if (buyerError) throw buyerError;
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    const { category, search } = req.query;
    let productsQuery = supabase
      .from('products')
      .select('*')
      .eq('created_by', buyer.assigned_admin);

    if (category) productsQuery = productsQuery.eq('category', category);
    if (search) productsQuery = productsQuery.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

    const { data: productRows, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    const pricingMultiplier = Number(buyer.custom_pricing_tier || 1);
    const customizedProducts = (productRows || []).map((p) => {
      const mapped = productService.mapProduct(p);
      return {
        ...mapped,
        customPrice: Number(mapped.sellingPrice || 0) * pricingMultiplier,
      };
    });

    res.json({
      buyerCompany: buyer.company_name || buyer.name,
      products: customizedProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
