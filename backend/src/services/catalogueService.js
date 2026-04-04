const supabase = require('../config/supabase');
const productService = require('./productService');

const CATALOGUE_SELECT = '*';

const mapCatalogue = (row) => {
  if (!row) return null;
  const normalizedId = row.id || row._id?.toString?.() || row._id || null;
  
  return {
    _id: normalizedId,
    id: normalizedId,
    name: row.name,
    buyerCompany: row.buyer_company,
    buyerEmail: row.buyer_email,
    linkToken: row.link_token,
    customColumns: row.custom_columns || [],
    status: row.status,
    lastAccessed: row.last_accessed,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    
    // Link Settings Mapping
    linkSettings: {
      requireEmail: row.require_email,
      requireEmailOTP: row.require_email_otp,
      emailAccessListMode: row.email_access_list_mode,
      emailAccessList: row.email_access_list || [],
      requirePhone: row.require_phone,
      requirePhoneOTP: row.require_phone_otp,
      expiresOn: row.expires_on,
      passcodeProtect: row.passcode_protect,
      passcode: row.passcode,
    }
  };
};

const sanitizeCatalogue = (catalogue) => {
  if (!catalogue) return null;
  return catalogue;
};

const getCatalogues = async (filters = {}) => {
  let query = supabase.from('catalogues').select(CATALOGUE_SELECT).order('created_at', { ascending: false });

  if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
  if (filters.status) query = query.eq('status', filters.status);
  
  const { data: catalogues, error } = await query;
  if (error) throw error;

  // For each catalogue, fetch associated products (just counts or IDs if needed, but usually we just return the list)
  const catalogueIds = (catalogues || []).map(c => c.id);
  
  if (catalogueIds.length === 0) return [];

  const { data: junctionData, error: junctionError } = await supabase
    .from('catalogue_products')
    .select('catalogue_id, product_id')
    .in('catalogue_id', catalogueIds);
  
  if (junctionError) throw junctionError;

  return catalogues.map(c => {
    const mapped = mapCatalogue(c);
    mapped.products = junctionData
      .filter(j => j.catalogue_id === c.id)
      .map(j => j.product_id);
    return mapped;
  });
};

const getCatalogueById = async (id) => {
  const { data: catalogue, error } = await supabase.from('catalogues').select(CATALOGUE_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!catalogue) return null;

  const { data: products, error: productError } = await supabase
    .from('catalogue_products')
    .select('product_id, order')
    .eq('catalogue_id', id)
    .order('order', { ascending: true });
  
  if (productError) throw productError;

  const mapped = mapCatalogue(catalogue);
  mapped.products = products.map(p => p.product_id);
  return mapped;
};

const getCatalogueByToken = async (token) => {
  const { data: catalogue, error } = await supabase.from('catalogues').select(CATALOGUE_SELECT).eq('link_token', token).maybeSingle();
  if (error) throw error;
  if (!catalogue) return null;

  // We need the ACTUAL product objects for the public preview
  const { data: productJunctions, error: productError } = await supabase
    .from('catalogue_products')
    .select('product_id, order')
    .eq('catalogue_id', catalogue.id)
    .order('order', { ascending: true });
  
  if (productError) throw productError;

  const productIds = productJunctions.map(p => p.product_id);
  
  // Fetch full product details
  const { data: fullProducts, error: fullProductError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);
  
  if (fullProductError) throw fullProductError;

  // Maintain order
  const orderedProducts = productIds.map(id => {
    const p = fullProducts.find(fp => fp.id === id);
    return productService.mapProduct(p);
  }).filter(Boolean);

  const mapped = mapCatalogue(catalogue);
  mapped.products = orderedProducts;
  return mapped;
};

const createCatalogue = async (payload) => {
  const { products, linkSettings, ...rest } = payload;
  
  const dbPayload = {
    name: rest.name,
    buyer_company: rest.buyerCompany,
    buyer_email: rest.buyerEmail || '',
    link_token: rest.linkToken,
    custom_columns: rest.customColumns || [],
    status: rest.status || 'Active',
    created_by: rest.createdBy,
    
    // Flattened Link Settings
    require_email: linkSettings?.requireEmail || false,
    require_email_otp: linkSettings?.requireEmailOTP || false,
    email_access_list_mode: linkSettings?.emailAccessListMode || 'none',
    email_access_list: linkSettings?.emailAccessList || [],
    require_phone: linkSettings?.requirePhone || false,
    require_phone_otp: linkSettings?.requirePhoneOTP || false,
    expires_on: linkSettings?.expiresOn || null,
    passcode_protect: linkSettings?.passcodeProtect || false,
    passcode: linkSettings?.passcode || '',
  };

  const { data: catalogue, error } = await supabase.from('catalogues').insert([dbPayload]).select().single();
  if (error) throw error;

  if (products && products.length > 0) {
    const junctionData = products.map((pid, index) => ({
      catalogue_id: catalogue.id,
      product_id: pid,
      order: index
    }));
    const { error: junctionError } = await supabase.from('catalogue_products').insert(junctionData);
    if (junctionError) throw junctionError;
  }

  return getCatalogueById(catalogue.id);
};

const updateCatalogue = async (id, payload) => {
  const { products, linkSettings, ...rest } = payload;
  
  const updates = {};
  if (rest.name !== undefined) updates.name = rest.name;
  if (rest.buyerCompany !== undefined) updates.buyer_company = rest.buyerCompany;
  if (rest.buyerEmail !== undefined) updates.buyer_email = rest.buyerEmail;
  if (rest.status !== undefined) updates.status = rest.status;
  if (rest.customColumns !== undefined) updates.custom_columns = rest.customColumns;
  if (rest.lastAccessed !== undefined) updates.last_accessed = rest.lastAccessed;

  if (linkSettings) {
    if (linkSettings.requireEmail !== undefined) updates.require_email = linkSettings.requireEmail;
    if (linkSettings.requireEmailOTP !== undefined) updates.require_email_otp = linkSettings.requireEmailOTP;
    if (linkSettings.emailAccessListMode !== undefined) updates.email_access_list_mode = linkSettings.emailAccessListMode;
    if (linkSettings.emailAccessList !== undefined) updates.email_access_list = linkSettings.emailAccessList;
    if (linkSettings.requirePhone !== undefined) updates.require_phone = linkSettings.requirePhone;
    if (linkSettings.requirePhoneOTP !== undefined) updates.require_phone_otp = linkSettings.requirePhoneOTP;
    if (linkSettings.expiresOn !== undefined) updates.expires_on = linkSettings.expiresOn;
    if (linkSettings.passcodeProtect !== undefined) updates.passcode_protect = linkSettings.passcodeProtect;
    if (linkSettings.passcode !== undefined) updates.passcode = linkSettings.passcode;
  }

  const { error } = await supabase.from('catalogues').update(updates).eq('id', id);
  if (error) throw error;

  if (products !== undefined) {
    // Sync junction table
    await supabase.from('catalogue_products').delete().eq('catalogue_id', id);
    if (products.length > 0) {
      const junctionData = products.map((pid, index) => ({
        catalogue_id: id,
        product_id: pid,
        order: index
      }));
      await supabase.from('catalogue_products').insert(junctionData);
    }
  }

  return getCatalogueById(id);
};

const deleteCatalogue = async (id) => {
  const { error } = await supabase.from('catalogues').delete().eq('id', id);
  if (error) throw error;
  return true;
};

const updateLastAccessed = async (id) => {
  const { error } = await supabase.from('catalogues').update({ last_accessed: new Date() }).eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = {
  getCatalogues,
  getCatalogueById,
  getCatalogueByToken,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
  updateLastAccessed,
  mapCatalogue,
};
