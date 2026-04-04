const productService = require('../services/productService');
const { logActivity } = require('./activityController');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Admin + Buyer)
const getProducts = async (req, res) => {
  try {
    const { category, subCategory, search, collectionName, sku, sortBy } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (subCategory) filters.subCategory = subCategory;
    if (collectionName) filters.collectionName = collectionName;
    if (sku) filters.sku = sku;
    if (search) filters.search = search;

    // Data Isolation
    if (req.user.role === 'admin') {
      filters.createdBy = req.user._id;
    } else if (req.user.role === 'buyer') {
      filters.createdBy = req.user.assignedAdmin;
    } else if (req.user.role === 'superadmin') {
      if (req.query.userId) {
        filters.createdBy = req.query.userId;
      }
    }

    let sortOptions = { column: 'created_at', ascending: false };
    if (sortBy) {
      switch (sortBy) {
        case 'Recent first':
          sortOptions = { column: 'created_at', ascending: false };
          break;
        case 'Product ID Asc':
          sortOptions = { column: 'sku', ascending: true };
          break;
        case 'Product ID Desc':
          sortOptions = { column: 'sku', ascending: false };
          break;
      }
    }

    const products = await productService.getProducts(filters, sortOptions);
    
    // Apply custom pricing if buyer
    if (req.user && req.user.role === 'buyer') {
      const multiplier = req.user.customPricingTier || 1;
      const customizedProducts = products.map(p => ({
        ...p,
        customPrice: p.sellingPrice * multiplier
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
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && String(product.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this product' });
    }
    if (req.user.role === 'buyer' && String(product.createdBy) !== String(req.user.assignedAdmin)) {
      return res.status(403).json({ message: 'Not authorized to access this product' });
    }
    
    // For Supabase, we don't have $gt/$lt on _id as easily, but we can just return the product.
    // If the frontend relies on prevId/nextId, we'd need to implement that in the service.
    // However, I'll keep it simple for now or implement a quick lookup if needed.
    
    const productPayload = {
      ...product,
      prevId: null, // Temporary null to maintain structure
      nextId: null,
    };

    if (req.user && req.user.role === 'buyer') {
      const multiplier = req.user.customPricingTier || 1;
      return res.json({
        ...productPayload,
        customPrice: product.sellingPrice * multiplier
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

    if (req.user && req.user.role === 'admin') {
      const planLimits = { free: 10, base: 15, premium: 20, gold: Infinity };
      const userPlan = req.user.plan || 'free';
      const limit = planLimits[userPlan];
      
      const currentCount = await productService.countProductsByAdmin(req.user._id);
      if (currentCount >= limit) {
        return res.status(403).json({ message: `Plan limit reached. Your ${userPlan} plan allows a maximum of ${limit} products.` });
      }
    }

    // auto generate sku if empty
    let finalSku = sku;
    if (!finalSku) {
      finalSku = 'SKU-' + Math.floor(10000 + Math.random() * 90000);
    }

    const productData = {
      name,
      sku: finalSku,
      description,
      sellingPrice: Number(basePrice || 0),
      dimensions: (dimensions && typeof dimensions === 'string') ? JSON.parse(dimensions) : (dimensions || {}),
      material,
      finish,
      cbm: Number(cbm || 0),
      collectionName,
      stock: Number(stock || 0),
      category,
      tags: (tags && typeof tags === 'string') ? JSON.parse(tags) : (tags || []),
      images: images.filter(img => img && img.trim() !== ''),
      createdBy: req.user._id
    };

    const createdProduct = await productService.createProduct(productData);
    await logActivity(req.user._id, 'product_add', `Added product: ${createdProduct.name} (SKU: ${createdProduct.sku})`, { productId: createdProduct._id });
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
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && product.createdBy && String(product.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { images, remainingImages, dimensions, tags, ...otherFields } = req.body;
    const updates = { ...otherFields };
    
    // Map basePrice to sellingPrice
    if (otherFields.basePrice !== undefined) {
      updates.sellingPrice = Number(otherFields.basePrice);
    }
    
    // Handle dimensions
    if (dimensions) {
      updates.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    }
    
    // Handle tags
    if (tags) {
      updates.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Handle images
    let finalImages = product.images || [];
    const imagesToKeep = remainingImages || images;
    if (imagesToKeep !== undefined) {
      const parsedImages = typeof imagesToKeep === 'string' ? JSON.parse(imagesToKeep) : imagesToKeep;
      if (Array.isArray(parsedImages)) {
        finalImages = parsedImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => req.protocol + '://' + req.get('host') + '/' + file.path.replace(/\\/g, '/'));
      finalImages = [...finalImages, ...newImages];
    }
    updates.images = finalImages.filter(img => img && img.trim() !== '');

    const updatedProduct = await productService.updateProduct(req.params.id, updates);

    await logActivity(req.user._id, 'product_update', `Updated product: ${updatedProduct.name}`, { 
      productId: updatedProduct._id
    });

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
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && product.createdBy && String(product.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await productService.deleteProduct(req.params.id);
    await logActivity(req.user._id, 'product_delete', `Deleted product: ${product.name} (SKU: ${product.sku})`, { productId: product._id });
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk-import
// @access  Private/Admin
const bulkImportProducts = async (req, res) => {
  try {
    let { products: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No product rows provided.' });
    }

    if (req.user && req.user.role === 'admin') {
      const planLimits = { free: 10, base: 15, premium: 20, gold: Infinity };
      const userPlan = req.user.plan || 'free';
      const limit = planLimits[userPlan];
      const currentCount = await productService.countProductsByAdmin(req.user._id);
      
      if (currentCount + rows.length > limit) {
        const allowed = Math.max(0, limit - currentCount);
        if (allowed === 0) {
          return res.status(403).json({ message: `Plan limit reached. Your ${userPlan} plan allows a maximum of ${limit} products.` });
        }
        rows = rows.slice(0, allowed);
      }
    }

    const toInsert = rows.map(row => {
      const sku = row.sku || 'SKU-' + Math.floor(10000 + Math.random() * 90000);
      let images = [];
      if (Array.isArray(row.images)) {
        images = row.images.filter(u => u && String(u).trim() !== '');
      } else if (row.images && typeof row.images === 'string') {
        images = row.images.split(',').map(u => u.trim()).filter(u => u !== '');
      }

      return {
        name: row.name,
        sku,
        category: row.category,
        sellingPrice: Number(row.sellingPrice || 0),
        variantId: row.variantId || '',
        subCategory: row.subCategory || '',
        productTag: row.productTag || '',
        theme: row.theme || '',
        season: row.season || '',
        collectionName: row.collectionName || '',
        searchKeywords: row.searchKeywords || '',
        stock: row.stock ? Number(row.stock) : 0,
        moq: row.moq ? Number(row.moq) : 1,
        images,
        createdBy: req.user._id,
        dimensions: row.dimensions || {
          width: row.width ? Number(row.width) : undefined,
          height: row.height ? Number(row.height) : undefined,
          depth: row.depth ? Number(row.depth) : undefined,
        }
      };
    });

    const importedProducts = await productService.bulkInsert(toInsert);
    await logActivity(req.user._id, 'product_bulk_import', `Bulk imported ${importedProducts.length} products`, { count: importedProducts.length });
    
    res.json({
      imported: importedProducts.length,
      skipped: rows.length - importedProducts.length,
      errors: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided for deletion.' });
    }

    const adminId = req.user.role === 'admin' ? req.user._id : null;
    const deletedCount = await productService.bulkDelete(ids, adminId);
    
    await logActivity(req.user._id, 'product_bulk_delete', `Bulk deleted ${deletedCount} products`, { count: deletedCount });
    res.json({ message: `${deletedCount} products removed.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI recommendations
const getRecommendations = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const filters = { category: categoryId };

    if (req.user.role === 'admin') {
      filters.createdBy = req.user._id;
    } else if (req.user.role === 'buyer') {
      filters.createdBy = req.user.assignedAdmin;
    }

    const products = await productService.getProducts(filters, { column: 'created_at', ascending: false });
    res.json(products.slice(0, 5));
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
  getRecommendations,
  bulkImportProducts,
  bulkDeleteProducts,
};
