const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();

    // Calculate revenue mapping orders
    const orders = await Order.find({ status: { $ne: 'pending' } });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Get 5 recent orders
    const recentOrders = await Order.find()
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
