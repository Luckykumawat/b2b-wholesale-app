const Order = require('../models/Order');
const Quotation = require('../models/Quotation');

// @desc    Convert quote to order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { quotationId, shippingAddress } = req.body;
    const quotation = await Quotation.findById(quotationId);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const order = new Order({
      quotation: quotation._id,
      buyer: quotation.buyer,
      products: quotation.products.map(p => ({
        product: p.product,
        quantity: p.quantity,
        price: p.quotedPrice
      })),
      totalAmount: quotation.totalAmount,
      shippingAddress: shippingAddress || quotation.buyer.companyDetails?.address,
      status: 'pending'
    });

    const createdOrder = await order.save();
    
    // Update quote status
    quotation.status = 'accepted';
    await quotation.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find().populate('buyer', 'name email').populate('products.product', 'name');
    } else {
      orders = await Order.find({ buyer: req.user._id }).populate('products.product', 'name');
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus
};
