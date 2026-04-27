const supabase = require('../config/supabase');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    let createdBy = null;
    let buyerId = null;
    let assignedAdmin = null;

    if (req.user.role === 'admin') {
      createdBy = req.user._id;
      assignedAdmin = req.user._id;
    } else if (req.user.role === 'buyer') {
      buyerId = req.user._id;
      // Buyers probably don't need the full dashboard, but if they access it:
    }

    // Orders count
    let ordersCountQuery = supabase.from('orders').select('id', { count: 'exact', head: true });
    if (createdBy) ordersCountQuery = ordersCountQuery.eq('created_by', createdBy);
    if (buyerId) ordersCountQuery = ordersCountQuery.eq('buyer_id', buyerId);
    const { count: totalOrders, error: totalOrdersError } = await ordersCountQuery;
    if (totalOrdersError) throw totalOrdersError;

    // Buyers count (for admin dashboards)
    let totalBuyers = 0;
    if (assignedAdmin) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'buyer')
        .eq('assigned_admin', assignedAdmin);
      if (error) throw error;
      totalBuyers = count || 0;
    }

    // Products count
    let productsCountQuery = supabase.from('products').select('id', { count: 'exact', head: true });
    if (createdBy) productsCountQuery = productsCountQuery.eq('created_by', createdBy);
    const { count: totalProducts, error: totalProductsError } = await productsCountQuery;
    if (totalProductsError) throw totalProductsError;

    // Revenue = sum(total_amount) from non-pending orders
    let revenueQuery = supabase
      .from('orders')
      .select('total_amount')
      .neq('status', 'pending');
    if (createdBy) revenueQuery = revenueQuery.eq('created_by', createdBy);
    if (buyerId) revenueQuery = revenueQuery.eq('buyer_id', buyerId);
    const { data: revenueRows, error: revenueError } = await revenueQuery;
    if (revenueError) throw revenueError;
    const totalRevenue = (revenueRows || []).reduce((acc, row) => acc + Number(row.total_amount || 0), 0);

    // Get 5 recent orders
    let recentOrdersQuery = supabase
      .from('orders')
      .select('id,total_amount,status,shipping_address,created_by,buyer:users!orders_buyer_id_fkey(id,name,email),created_at,updated_at')
      .limit(5);
    if (createdBy) recentOrdersQuery = recentOrdersQuery.eq('created_by', createdBy);
    if (buyerId) recentOrdersQuery = recentOrdersQuery.eq('buyer_id', buyerId);
    recentOrdersQuery = recentOrdersQuery.order('created_at', { ascending: false });
    const { data: recentOrderRows, error: recentOrdersError } = await recentOrdersQuery;
    if (recentOrdersError) throw recentOrdersError;

    const recentOrders = (recentOrderRows || []).map((row) => ({
      _id: row.id,
      id: row.id,
      buyer: row.buyer
        ? { _id: row.buyer.id, id: row.buyer.id, name: row.buyer.name, email: row.buyer.email }
        : null,
      totalAmount: Number(row.total_amount || 0),
      shippingAddress: row.shipping_address || '',
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      totalOrders: totalOrders || 0,
      totalBuyers,
      totalProducts: totalProducts || 0,
      totalRevenue,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
