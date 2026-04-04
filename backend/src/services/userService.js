const supabase = require('../config/supabase');

const USER_SELECT =
  'id,name,email,password,role,phone,company_name,company_details,custom_pricing_tier,assigned_admin,created_at';

const mapUser = (row) => {
  if (!row) return null;
  const normalizedId = row.id || row._id?.toString?.() || row._id || null;
  return {
    _id: normalizedId,
    id: normalizedId,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role || 'admin',
    phone: row.phone || '',
    companyName: row.company_name ?? row.companyName ?? '',
    state: row.state || '',
    district: row.district || '',
    country: row.country || '',
    companyDetails: row.company_details ?? row.companyDetails ?? {},
    customPricingTier: row.custom_pricing_tier ?? row.customPricingTier ?? 1,
    assignedAdmin: row.assigned_admin ?? row.assignedAdmin ?? null,
    status: row.status || 'active',
    plan: row.plan || 'free',
    planStartDate: row.plan_start_date ?? row.planStartDate ?? new Date(),
    createdAt: row.created_at ?? row.createdAt ?? new Date(),
  };
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const getByEmail = async (email) => {
  console.log('Using Supabase for user operations. USER_SELECT:', USER_SELECT);
  const { data, error } = await supabase.from('users').select(USER_SELECT).eq('email', email).maybeSingle();
  if (error) throw error;
  return mapUser(data);
};

const getById = async (id) => {
  console.log('Using Supabase for user operations');
  const { data, error } = await supabase.from('users').select(USER_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return mapUser(data);
};

const createUser = async (payload) => {
  const dbPayload = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    phone: payload.phone || null,
    company_name: payload.companyName || null,
    company_details: payload.companyDetails || null,
    custom_pricing_tier: payload.customPricingTier ?? 1,
    assigned_admin: payload.assignedAdmin || null,
    // status: payload.status || 'active', // Missing in Supabase table
    // plan: payload.plan || 'free', // Missing in Supabase table
  };

  console.log('Using Supabase for user operations');

  const insertResult = await supabase.from('users').insert([dbPayload]).select(USER_SELECT).single();
  const { data, error } = insertResult;

  console.log('Supabase createUser insert full response:', JSON.stringify({ data, error }, null, 2));

  if (error) {
    console.error('[userService] Supabase insert failed:', error.message, error.details, error.hint, error.code);
    throw error;
  }

  return mapUser(data);
};

const updateUser = async (id, payload) => {
  console.log('Using Supabase for user operations');
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.password !== undefined) updates.password = payload.password;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.companyName !== undefined) updates.company_name = payload.companyName;
  if (payload.state !== undefined) updates.state = payload.state;
  if (payload.district !== undefined) updates.district = payload.district;
  if (payload.country !== undefined) updates.country = payload.country;
  if (payload.companyDetails !== undefined) updates.company_details = payload.companyDetails;
  if (payload.customPricingTier !== undefined) updates.custom_pricing_tier = payload.customPricingTier;
  if (payload.assignedAdmin !== undefined) updates.assigned_admin = payload.assignedAdmin;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.plan !== undefined) updates.plan = payload.plan;

  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select(USER_SELECT).maybeSingle();
  if (error) throw error;
  return mapUser(data);
};

const listBuyersByAdmin = async (adminId) => {
  console.log('Using Supabase for user operations');
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('role', 'buyer')
    .eq('assigned_admin', adminId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => sanitizeUser(mapUser(row)));
};

const listAdmins = async (filters = {}) => {
  console.log('Using Supabase for user operations');
  let query = supabase.from('users').select(USER_SELECT).eq('role', 'admin').order('created_at', { ascending: false });

  if (filters.name) query = query.ilike('name', `%${filters.name}%`);
  if (filters.email) query = query.ilike('email', `%${filters.email}%`);
  if (filters.phone) query = query.ilike('phone', `%${filters.phone}%`);
  if (filters.companyName) query = query.ilike('company_name', `%${filters.companyName}%`);
  // These columns are missing in Supabase:
  // if (filters.state) query = query.ilike('state', `%${filters.state}%`);
  // if (filters.district) query = query.ilike('district', `%${filters.district}%`);
  // if (filters.country) query = query.ilike('country', `%${filters.country}%`);

  const { data, error } = await query;
  if (error) throw error;

  const admins = (data || []).map((row) => sanitizeUser(mapUser(row)));
  const adminIds = admins.map((a) => a._id);
  if (!adminIds.length) return admins;

  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('created_by')
    .in('created_by', adminIds);

  if (productError) {
    return admins.map((admin) => ({ ...admin, productCount: 0 }));
  }

  const counts = productRows.reduce((acc, row) => {
    acc[row.created_by] = (acc[row.created_by] || 0) + 1;
    return acc;
  }, {});

  return admins.map((admin) => ({
    ...admin,
    productCount: counts[admin._id] || 0,
  }));
};

const getUsersByNames = async (names) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .in('name', names);
  if (error) throw error;
  return data || [];
};

const getBuyersByAdmin = async (adminId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, company_name')
    .eq('role', 'buyer')
    .eq('assigned_admin', adminId);
  if (error) throw error;
  return data || [];
};

module.exports = {
  createUser,
  getByEmail,
  getById,
  listBuyersByAdmin,
  listAdmins,
  sanitizeUser,
  updateUser,
  getUsersByNames,
  getBuyersByAdmin,
};
