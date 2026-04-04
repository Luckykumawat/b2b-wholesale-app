const supabase = require('../config/supabase');
const productService = require('./productService');

const QUOTATION_SELECT = '*, buyer:users!quotations_buyer_id_fkey(id, name, email, company_name)';

const mapQuotation = (row) => {
  if (!row) return null;
  const normalizedId = row.id || row._id?.toString?.() || row._id || null;
  return {
    _id: normalizedId,
    id: normalizedId,
    buyer: {
      _id: row.buyer?.id || row.buyer_id,
      id: row.buyer?.id || row.buyer_id,
      name: row.buyer?.name || 'Unknown',
      email: row.buyer?.email || 'N/A',
      companyName: row.buyer?.company_name || ''
    },
    totalAmount: Number(row.total_amount),
    status: row.status,
    pdfUrl: row.pdf_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getQuotations = async (filters = {}) => {
  let query = supabase.from('quotations').select(QUOTATION_SELECT).order('created_at', { ascending: false });

  if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
  if (filters.buyerId) query = query.eq('buyer_id', filters.buyerId);
  if (filters.status) query = query.eq('status', filters.status);

  // Advanced Filtering for Admins (OR logic)
  if (filters.adminId && filters.buyerIdList) {
    if (filters.buyerIdList.length > 0) {
      const buyerIdsStr = filters.buyerIdList.join(',');
      query = query.or(`created_by.eq.${filters.adminId},buyer_id.in.(${buyerIdsStr})`);
    } else {
      // Just filter by adminId if no buyers assigned
      query = query.eq('created_by', filters.adminId);
    }
  } else {
    if (filters.createdByList) query = query.in('created_by', filters.createdByList);
    if (filters.buyerIdList) query = query.in('buyer_id', filters.buyerIdList);
  }

  const { data: quotations, error } = await query;
  if (error) throw error;

  if (!quotations || quotations.length === 0) return [];

  const quotationIds = quotations.map(q => q.id);

  // Fetch items for all quotations in one go
  const { data: items, error: itemsError } = await supabase
    .from('quotation_items')
    .select('*, product:products(*)')
    .in('quotation_id', quotationIds);

  if (itemsError) throw itemsError;

  return quotations.map(q => {
    const mapped = mapQuotation(q);
    mapped.products = items
      .filter(i => i.quotation_id === q.id)
      .map(i => ({
        product: productService.mapProduct(i.product),
        quantity: i.quantity,
        quotedPrice: Number(i.quoted_price)
      }));
    return mapped;
  });
};

const getQuotationById = async (id) => {
  const { data: quotation, error } = await supabase.from('quotations').select(QUOTATION_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!quotation) return null;

  const { data: items, error: itemsError } = await supabase
    .from('quotation_items')
    .select('*, product:products(*)')
    .eq('quotation_id', id);

  if (itemsError) throw itemsError;

  const mapped = mapQuotation(quotation);
  mapped.products = items.map(i => ({
    product: productService.mapProduct(i.product),
    quantity: i.quantity,
    quotedPrice: Number(i.quoted_price)
  }));
  return mapped;
};

const createQuotation = async (payload) => {
  const { products, ...rest } = payload;
  
  const calculatedTotal = rest.totalAmount !== undefined 
    ? rest.totalAmount 
    : products.reduce((acc, p) => acc + ((p.quotedPrice || 0) * (p.quantity || 1)), 0);

  const dbPayload = {
    buyer_id: rest.buyer,
    total_amount: calculatedTotal,
    status: rest.status || 'pending',
    pdf_url: rest.pdfUrl,
    created_by: rest.createdBy,
  };

  const { data: quotation, error } = await supabase.from('quotations').insert([dbPayload]).select().single();
  if (error) throw error;

  if (products && products.length > 0) {
    const itemData = products.map(p => ({
      quotation_id: quotation.id,
      product_id: p.product,
      quantity: p.quantity,
      quoted_price: p.quotedPrice
    }));
    const { error: itemsError } = await supabase.from('quotation_items').insert(itemData);
    if (itemsError) throw itemsError;
  }

  return getQuotationById(quotation.id);
};

const updateQuotation = async (id, payload) => {
  const { products, ...rest } = payload;
  
  const updates = {};
  if (rest.totalAmount !== undefined) updates.total_amount = rest.totalAmount;
  if (rest.status !== undefined) updates.status = rest.status;
  if (rest.pdfUrl !== undefined) updates.pdf_url = rest.pdfUrl;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('quotations').update(updates).eq('id', id);
    if (error) throw error;
  }

  if (products !== undefined) {
    // Delete existing items and re-insert
    await supabase.from('quotation_items').delete().eq('quotation_id', id);
    if (products.length > 0) {
      const itemData = products.map(p => ({
        quotation_id: id,
        product_id: p.product._id || p.product,
        quantity: p.quantity,
        quoted_price: p.quotedPrice
      }));
      const { error: itemsError } = await supabase.from('quotation_items').insert(itemData);
      if (itemsError) throw itemsError;
    }
  }

  return getQuotationById(id);
};

const updateQuotationStatus = async (id, status) => {
  const { data, error } = await supabase.from('quotations').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return mapQuotation(data);
};

const deleteQuotation = async (id) => {
  const { error } = await supabase.from('quotations').delete().eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  updateQuotation,
  deleteQuotation,
  mapQuotation,
};
