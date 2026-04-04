const supabase = require('../config/supabase');

const PRODUCT_SELECT = '*'; // We'll select all for now

const mapProduct = (row) => {
  if (!row) return null;
  const normalizedId = row.id || row._id?.toString?.() || row._id || null;
  return {
    _id: normalizedId,
    id: normalizedId,
    name: row.name,
    sku: row.sku,
    category: row.category,
    subCategory: row.sub_category,
    sellingPrice: Number(row.selling_price),
    sellingPrice_Currency: row.selling_price_currency,
    sellingPrice_Unit: row.selling_price_unit,
    variantId: row.variant_id,
    productTag: row.product_tag,
    tags: row.tags || [],
    collectionName: row.collection_name,
    theme: row.theme,
    season: row.season,
    searchKeywords: row.search_keywords,
    productCost: row.product_cost,
    productCost_Currency: row.product_cost_currency,
    productCost_Unit: row.product_cost_unit,
    vendorPrice: row.vendor_price,
    vendorPrice_Currency: row.vendor_price_currency,
    vendorPrice_Unit: row.vendor_price_unit,
    stock: row.stock,
    moq: row.moq,
    samplingTime: row.sampling_time,
    productionTime: row.production_time,
    ft20: row.ft20,
    ft40HC: row.ft40hc,
    ft40GP: row.ft40gp,
    sizeCM: row.size_cm,
    dimensions: {
      width: row.width,
      height: row.height,
      depth: row.depth,
      unit: row.dimensions_unit,
    },
    cbm: row.cbm,
    color: row.color,
    material: row.material,
    metalFinish: row.metal_finish,
    woodFinish: row.wood_finish,
    assembledKD: row.assembled_kd,
    vendorName: row.vendor_name,
    productionTechnique: row.production_technique,
    exclusiveFor: row.exclusive_for,
    countryOfOrigin: row.country_of_origin,
    description: row.description,
    remarks: row.remarks,
    variationHinge: row.variation_hinge,
    images: row.images || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const sanitizeProduct = (product) => {
  if (!product) return null;
  return product;
};

const getProducts = async (filters = {}, sort = { column: 'created_at', ascending: false }) => {
  let query = supabase.from('products').select(PRODUCT_SELECT);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.subCategory) query = query.eq('sub_category', filters.subCategory);
  if (filters.collectionName) query = query.eq('collection_name', filters.collectionName);
  if (filters.sku) query = query.ilike('sku', `%${filters.sku}%`);
  if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
  
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }

  query = query.order(sort.column, { ascending: sort.ascending });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapProduct);
};

const getProductById = async (id) => {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return mapProduct(data);
};

const createProduct = async (payload) => {
  const dbPayload = {
    name: payload.name,
    sku: payload.sku,
    category: payload.category,
    selling_price: payload.sellingPrice,
    selling_price_currency: payload.sellingPrice_Currency || 'USD',
    selling_price_unit: payload.sellingPrice_Unit,
    variant_id: payload.variantId,
    sub_category: payload.subCategory,
    product_tag: payload.productTag,
    tags: payload.tags || [],
    collection_name: payload.collectionName,
    theme: payload.theme,
    season: payload.season,
    search_keywords: payload.searchKeywords,
    product_cost: payload.productCost,
    product_cost_currency: payload.productCost_Currency,
    product_cost_unit: payload.productCost_Unit,
    vendor_price: payload.vendorPrice,
    vendor_price_currency: payload.vendorPrice_Currency,
    vendor_price_unit: payload.vendorPrice_Unit,
    stock: payload.stock || 0,
    moq: payload.moq || 1,
    sampling_time: payload.samplingTime,
    production_time: payload.productionTime,
    ft20: payload.ft20,
    ft40hc: payload.ft40HC,
    ft40gp: payload.ft40GP,
    size_cm: payload.sizeCM,
    width: payload.dimensions?.width,
    height: payload.dimensions?.height,
    depth: payload.dimensions?.depth,
    dimensions_unit: payload.dimensions?.unit || 'cm',
    cbm: payload.cbm,
    color: payload.color,
    material: payload.material,
    metal_finish: payload.metalFinish,
    wood_finish: payload.woodFinish,
    assembled_kd: payload.assembledKD,
    vendor_name: payload.vendorName,
    production_technique: payload.productionTechnique,
    exclusive_for: payload.exclusiveFor,
    country_of_origin: payload.countryOfOrigin,
    description: payload.description,
    remarks: payload.remarks,
    variation_hinge: payload.variationHinge,
    images: payload.images || [],
    created_by: payload.createdBy,
  };

  const { data, error } = await supabase.from('products').insert([dbPayload]).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return mapProduct(data);
};

const updateProduct = async (id, payload) => {
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.sku !== undefined) updates.sku = payload.sku;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.sellingPrice !== undefined) updates.selling_price = payload.sellingPrice;
  if (payload.subCategory !== undefined) updates.sub_category = payload.subCategory;
  if (payload.collectionName !== undefined) updates.collection_name = payload.collectionName;
  if (payload.stock !== undefined) updates.stock = payload.stock;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.images !== undefined) updates.images = payload.images;
  if (payload.tags !== undefined) updates.tags = payload.tags;

  if (payload.dimensions) {
    if (payload.dimensions.width !== undefined) updates.width = payload.dimensions.width;
    if (payload.dimensions.height !== undefined) updates.height = payload.dimensions.height;
    if (payload.dimensions.depth !== undefined) updates.depth = payload.dimensions.depth;
    if (payload.dimensions.unit !== undefined) updates.dimensions_unit = payload.dimensions.unit;
  }

  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return mapProduct(data);
};

const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
};

const countProductsByAdmin = async (adminId) => {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', adminId);
  if (error) throw error;
  return count;
};

const bulkInsert = async (products) => {
  const dbProducts = products.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.category,
    selling_price: p.sellingPrice,
    selling_price_currency: p.sellingPrice_Currency || 'USD',
    selling_price_unit: p.sellingPrice_Unit,
    variant_id: p.variantId,
    sub_category: p.subCategory,
    product_tag: p.productTag,
    tags: p.tags || [],
    collection_name: p.collectionName,
    theme: p.theme,
    season: p.season,
    search_keywords: p.searchKeywords,
    product_cost: p.productCost,
    product_cost_currency: p.productCost_Currency,
    product_cost_unit: p.productCost_Unit,
    vendor_price: p.vendorPrice,
    vendor_price_currency: p.vendorPrice_Currency,
    vendor_price_unit: p.vendorPrice_Unit,
    stock: p.stock || 0,
    moq: p.moq || 1,
    sampling_time: p.samplingTime,
    production_time: p.productionTime,
    ft20: p.ft20,
    ft40hc: p.ft40HC,
    ft40gp: p.ft40GP,
    size_cm: p.sizeCM,
    width: p.dimensions?.width,
    height: p.dimensions?.height,
    depth: p.dimensions?.depth,
    dimensions_unit: p.dimensions?.unit || 'cm',
    cbm: p.cbm,
    color: p.color,
    material: p.material,
    metal_finish: p.metalFinish,
    wood_finish: p.woodFinish,
    assembled_kd: p.assembledKD,
    vendor_name: p.vendorName,
    production_technique: p.productionTechnique,
    exclusive_for: p.exclusiveFor,
    country_of_origin: p.countryOfOrigin,
    description: p.description,
    remarks: p.remarks,
    variation_hinge: p.variationHinge,
    images: p.images || [],
    created_by: p.createdBy,
  }));

  const { data, error } = await supabase.from('products').insert(dbProducts).select(PRODUCT_SELECT);
  if (error) throw error;
  return (data || []).map(mapProduct);
};

const bulkDelete = async (ids, adminId = null) => {
  let query = supabase.from('products').delete().in('id', ids);
  if (adminId) query = query.eq('created_by', adminId);
  
  const { data, error } = await query.select();
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  countProductsByAdmin,
  bulkInsert,
  bulkDelete,
  mapProduct,
};
