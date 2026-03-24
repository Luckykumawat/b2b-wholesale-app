const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Admin + Buyer)
const getProducts = async (req, res) => {
  try {
    const { category, search, collectionName, sku } = req.query;
    let query = {};

    if (category) query.category = category;
    if (collectionName) query.collectionName = collectionName;
    if (sku) query.sku = { $regex: sku, $options: 'i' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // Apply custom pricing if buyer
    if (req.user && req.user.role === 'buyer') {
      const multiplier = req.user.customPricingTier || 1;
      const customizedProducts = products.map(p => ({
        ...p.toObject(),
        customPrice: p.basePrice * multiplier
      }));
      return res.json(customizedProducts);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Fetch prev/next products by createdAt ensuring no crash on old unsaved dates
    let prevProduct = null;
    let nextProduct = null;
    if (product.createdAt) {
      prevProduct = await Product.findOne({ createdAt: { $lt: product.createdAt } }).sort({ createdAt: -1 }).select('_id');
      nextProduct = await Product.findOne({ createdAt: { $gt: product.createdAt } }).sort({ createdAt: 1 }).select('_id');
    }

    const productPayload = {
      ...product.toObject(),
      prevId: prevProduct ? prevProduct._id : null,
      nextId: nextProduct ? nextProduct._id : null,
    };

    if (req.user && req.user.role === 'buyer') {
      const multiplier = req.user.customPricingTier || 1;
      return res.json({
        ...productPayload,
        customPrice: product.basePrice * multiplier
      });
    }

    res.json(productPayload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, sku, description, basePrice, dimensions, material, finish, cbm, collectionName, stock, category, tags } = req.body;
    let images = [];
    
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => req.protocol + '://' + req.get('host') + '/' + file.path.replace(/\\/g, '/'));
    }

    // auto generate sku if empty
    let finalSku = sku;
    if (!finalSku) {
      finalSku = 'SKU-' + Math.floor(10000 + Math.random() * 90000);
    }

    const product = new Product({
      name,
      sku: finalSku,
      description,
      basePrice,
      dimensions: (dimensions && typeof dimensions === 'string') ? JSON.parse(dimensions) : (dimensions || {}),
      material,
      finish,
      cbm,
      collectionName,
      stock,
      category,
      tags: (tags && typeof tags === 'string') ? JSON.parse(tags) : (tags || []),
      images: images.filter(img => img && img.trim() !== '')
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    console.log('Update Product Request Body:', req.body);
    console.log('Update Product Files:', req.files ? req.files.length : 0);
    
    const { images, remainingImages, dimensions, tags, ...otherFields } = req.body;
    
    // Assign fields that are directly strings/numbers
    Object.assign(product, otherFields);
    
    // Handle dimensions
    if (dimensions) {
      try {
        product.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      } catch (err) {
        console.error('Error parsing dimensions', err);
      }
    }
    
    // Handle tags
    if (tags) {
      try {
        product.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (err) {
        console.error('Error parsing tags', err);
      }
    }

    // Handle image updates (remaining images)
    // We check both 'remainingImages' and 'images' to be compatible with old/new frontend
    const imagesToKeep = remainingImages || images;
    if (imagesToKeep !== undefined) {
      try {
        const parsedImages = typeof imagesToKeep === 'string' ? JSON.parse(imagesToKeep) : imagesToKeep;
        if (Array.isArray(parsedImages)) {
          // Update product.images with the ones we want to keep
          product.images = parsedImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
        }
      } catch (err) {
        console.error('Error parsing remaining images', err);
      }
    }

    // Handle adding new files
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => req.protocol + '://' + req.get('host') + '/' + file.path.replace(/\\/g, '/'));
      product.images = [...product.images, ...newImages];
    }

    // Ensure all image URLs are clean
    product.images = product.images.filter(img => img && typeof img === 'string' && img.trim() !== '');

    console.log('Final product images before save:', product.images);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI recommendations
// @route   GET /api/products/recommendations/:categoryId
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Simple content-based recommendation matching category or tags
    const products = await Product.find({ category: categoryId }).limit(5);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecommendations
};
