const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    let query = {};
    let buyerQuery = { role: 'buyer' };

    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
      buyerQuery.assignedAdmin = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.buyer = req.user._id;
      // Buyers probably don't need the full dashboard, but if they access it:
    }

    const totalOrders = await Order.countDocuments(query);
    const totalBuyers = await User.countDocuments(buyerQuery);
    const totalProducts = await Product.countDocuments(query);

    // Calculate revenue mapping orders
    const orders = await Order.find({ ...query, status: { $ne: 'pending' } });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Get 5 recent orders
    const recentOrders = await Order.find(query)
      .populate('buyer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalOrders,
      totalBuyers,
      totalProducts,
      totalRevenue,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
