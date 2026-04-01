const Product = require('../models/Product');
const { logActivity } = require('./activityController');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Admin + Buyer)
const getProducts = async (req, res) => {
  try {
    const { category, subCategory, search, collectionName, sku, sortBy } = req.query;
    let query = {};

    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (collectionName) query.collectionName = collectionName;
    if (sku) query.sku = { $regex: sku, $options: 'i' };

    // Data Isolation
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.createdBy = req.user.assignedAdmin;
    } else if (req.user.role === 'superadmin') {
      // Superadmin can filter by userId if provided, otherwise see all
      if (req.query.userId) {
        query.createdBy = req.query.userId;
      }
    }
    // superadmin sees all or can be restricted too, for now let them see all if they use this endpoint

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'Recent first':
          sortOptions = { createdAt: -1 };
          break;
        case 'Product ID Asc':
          sortOptions = { sku: 1 };
          break;
        case 'Product ID Desc':
          sortOptions = { sku: -1 };
          break;
      }
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .collation({ locale: 'en', numericOrdering: true });
    
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

    // Data Isolation Check
    if (req.user.role === 'admin' && !product.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this product' });
    }
    if (req.user.role === 'buyer' && !product.createdBy.equals(req.user.assignedAdmin)) {
      return res.status(403).json({ message: 'Not authorized to access this product' });
    }
    
    // Fetch prev/next products by _id to ensure strict ordering and avoid exact-timestamp collisions
    // "prev" means structurally higher in the descending list (newer -> greater _id)
    const prevProduct = await Product.findOne({ _id: { $gt: product._id } }).sort({ _id: 1 }).select('_id');
    // "next" means structurally lower in the descending list (older -> smaller _id)
    const nextProduct = await Product.findOne({ _id: { $lt: product._id } }).sort({ _id: -1 }).select('_id');

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

    if (req.user && req.user.role === 'admin') {
      const planLimits = { free: 10, base: 15, premium: 20, gold: Infinity };
      const userPlan = req.user.plan || 'free';
      const limit = planLimits[userPlan];
      
      const currentCount = await Product.countDocuments({ createdBy: req.user._id });
      if (currentCount >= limit) {
        return res.status(403).json({ message: `Plan limit reached. Your ${userPlan} plan allows a maximum of ${limit} products.` });
      }
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
      sellingPrice: basePrice, // Map basePrice to sellingPrice
      images: images.filter(img => img && img.trim() !== ''),
      createdBy: req.user._id
    });

    const createdProduct = await product.save();
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && product.createdBy && !product.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    console.log('Update Product Request Body:', req.body);
    console.log('Update Product Files:', req.files ? req.files.length : 0);
    
    const originalProduct = product.toObject();
    const { images, remainingImages, dimensions, tags, ...otherFields } = req.body;
    
    // Assign fields that are directly strings/numbers
    Object.assign(product, otherFields);
    
    // Map basePrice to sellingPrice if basePrice is provided
    if (otherFields.basePrice !== undefined) {
      product.sellingPrice = otherFields.basePrice;
    }
    
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

    const updatedProduct = await product.save();

    // Determine what changed
    const changedFields = [];
    const fieldsToTrack = ['name', 'sku', 'category', 'basePrice', 'stock', 'material', 'finish', 'cbm', 'collectionName'];
    
    for (const field of fieldsToTrack) {
      if (String(originalProduct[field] || '') !== String(updatedProduct[field] || '')) {
        changedFields.push(field);
      }
    }
    
    // Also check dimensions
    const formatDims = (d) => d ? `${d.width || ''}x${d.height || ''}x${d.depth || ''}` : '';
    if (formatDims(originalProduct.dimensions) !== formatDims(updatedProduct.dimensions)) {
      changedFields.push('dimensions');
    }

    // Also check images 
    if (JSON.stringify(originalProduct.images || []) !== JSON.stringify(updatedProduct.images || [])) {
      changedFields.push('images');
    }

    let detailStr = `Updated product: ${updatedProduct.name}`;
    if (changedFields.length > 0) {
      detailStr += ` (Changed: ${changedFields.join(', ')})`;
    }

    await logActivity(req.user._id, 'product_update', detailStr, { 
      productId: updatedProduct._id,
      changedFields
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && product.createdBy && !product.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    await logActivity(req.user._id, 'product_delete', `Deleted product: ${product.name} (SKU: ${product.sku})`, { productId: product._id });
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import products from CSV/Excel (already parsed by frontend)
// @route   POST /api/products/bulk-import
// @access  Private/Admin
const bulkImportProducts = async (req, res) => {
  try {
    let { products: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No product rows provided.' });
    }

    let extraSkipped = 0;
    if (req.user && req.user.role === 'admin') {
      const planLimits = { free: 10, base: 15, premium: 20, gold: Infinity };
      const userPlan = req.user.plan || 'free';
      const limit = planLimits[userPlan];
      
      const currentCount = await Product.countDocuments({ createdBy: req.user._id });
      if (currentCount + rows.length > limit) {
        const allowed = Math.max(0, limit - currentCount);
        if (allowed === 0) {
          return res.status(403).json({ message: `Plan limit reached. Your ${userPlan} plan allows a maximum of ${limit} products.` });
        } else {
          extraSkipped = rows.length - allowed;
          rows = rows.slice(0, allowed);
        }
      }
    }

    const toInsert = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const missingFields = [];
      if (!row.name) missingFields.push('Product Name');
      if (!row.category) missingFields.push('Category');
      if (row.sellingPrice === undefined || row.sellingPrice === null || row.sellingPrice === '') missingFields.push('Selling Price');

      if (missingFields.length > 0) {
        errors.push({ row: rowNum, reason: `Missing required fields: ${missingFields.join(', ')}`, data: row });
        return;
      }

      const sku = row.sku && String(row.sku).trim() !== ''
        ? String(row.sku).trim()
        : 'SKU-' + Math.floor(10000 + Math.random() * 90000);

      // Parse image URLs — support comma-separated strings or arrays
      let images = [];
      if (Array.isArray(row.images)) {
        images = row.images.filter(u => u && String(u).trim() !== '');
      } else if (row.images && typeof row.images === 'string' && row.images.trim() !== '') {
        images = row.images.split(',').map(u => u.trim()).filter(u => u !== '');
      }

      toInsert.push({
        name: row.name,
        sku,
        variantId: row.variantId || '',
        category: row.category,
        subCategory: row.subCategory || '',
        productTag: row.productTag || '',
        theme: row.theme || '',
        season: row.season || '',
        collectionName: row.collectionName || '',
        searchKeywords: row.searchKeywords || '',
        
        sellingPrice: Number(row.sellingPrice),
        sellingPrice_Currency: row.sellingPrice_Currency || 'USD',
        sellingPrice_Unit: row.sellingPrice_Unit || '',
        
        productCost: row.productCost ? Number(row.productCost) : undefined,
        productCost_Currency: row.productCost_Currency || '',
        productCost_Unit: row.productCost_Unit || '',

        vendorPrice: row.vendorPrice ? Number(row.vendorPrice) : undefined,
        vendorPrice_Currency: row.vendorPrice_Currency || '',
        vendorPrice_Unit: row.vendorPrice_Unit || '',

        stock: row.stock ? Number(row.stock) : 0,
        moq: row.moq ? Number(row.moq) : 1,
        samplingTime: row.samplingTime || '',
        productionTime: row.productionTime || '',
        
        ft20: row.ft20 || '',
        ft40HC: row.ft40HC || '',
        ft40GP: row.ft40GP || '',

        sizeCM: row.sizeCM || '',
        cbm: row.cbm ? Number(row.cbm) : undefined,
        color: row.color || '',
        material: row.material || '',
        metalFinish: row.metalFinish || '',
        woodFinish: row.woodFinish || '',
        assembledKD: row.assembledKD || '',

        vendorName: row.vendorName || '',
        productionTechnique: row.productionTechnique || '',
        exclusiveFor: row.exclusiveFor || '',
        
        remarks: row.remarks || '',
        variationHinge: row.variationHinge || '',
        description: row.description || '',
        images,
        createdBy: req.user._id,
        // Handle dimensions if provided as separate cols or object
        dimensions: row.dimensions ? row.dimensions : {
          width: row.width ? Number(row.width) : undefined,
          height: row.height ? Number(row.height) : undefined,
          depth: row.depth ? Number(row.depth) : undefined,
        }
      });
    });

    let imported = 0;
    const insertErrors = [];

    if (toInsert.length > 0) {
      try {
        const result = await Product.insertMany(toInsert, { ordered: false });
        imported = result.length;
      } catch (bulkErr) {
        // ordered:false — some docs may have been inserted even if errors occurred
        if (bulkErr.insertedDocs) imported = bulkErr.insertedDocs.length;
        if (bulkErr.writeErrors) {
          bulkErr.writeErrors.forEach(we => {
            insertErrors.push({ reason: we.errmsg || 'Duplicate SKU or DB error', data: toInsert[we.index] });
          });
        }
      }
    }

    res.json({
      imported,
      skipped: errors.length + insertErrors.length + extraSkipped,
      errors: [...errors, ...insertErrors],
    });
    if (imported > 0) {
      await logActivity(req.user._id, 'product_bulk_import', `Bulk imported ${imported} products`, { count: imported });
    }
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

    const deleteQuery = { _id: { $in: ids } };
    if (req.user.role === 'admin') {
      deleteQuery.createdBy = req.user._id;
    }

    const result = await Product.deleteMany(deleteQuery);
    await logActivity(req.user._id, 'product_bulk_delete', `Bulk deleted ${result.deletedCount} products`, { count: result.deletedCount });
    res.json({ message: `${result.deletedCount} products removed.` });
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
    let query = { category: categoryId };

    // Data Isolation
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.createdBy = req.user.assignedAdmin;
    }

    // Simple content-based recommendation matching category or tags
    const products = await Product.find(query).limit(5);
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
  getRecommendations,
  bulkImportProducts,
  bulkDeleteProducts,
};
