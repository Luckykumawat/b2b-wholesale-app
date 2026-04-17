const orderService = require('../services/orderService');
const quotationService = require('../services/quotationService');

// @desc    Convert quote to order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    console.log("Using Supabase for order operations");
    const { quotationId, shippingAddress } = req.body;
    
    // Use quotationService instead of Mongoose Model
    const quotation = await quotationService.getQuotationById(quotationId);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Prepare payload for orderService
    const orderPayload = {
      quotationId: quotation.id,
      buyerId: quotation.buyer.id,
      products: quotation.products,
      totalAmount: quotation.totalAmount,
      shippingAddress: shippingAddress || (quotation.buyer.companyDetails?.address || ''),
      status: 'pending',
      createdBy: req.user._id || req.user.id
    };

    const createdOrder = await orderService.createOrder(orderPayload);
    
    // Update quote status
    await quotationService.updateQuotationStatus(quotationId, 'accepted');

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
    console.log("Using Supabase for order operations");
    let orders;
    const userId = req.user._id || req.user.id;
    
    if (req.user.role === 'admin') {
      orders = await orderService.getAllOrders(userId);
    } else {
      orders = await orderService.getOrdersByBuyer(userId);
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
    console.log("Using Supabase for order operations");
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Data Isolation Check
    const userId = req.user._id || req.user.id;
    if (req.user.role === 'admin' && order.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const updatedOrder = await orderService.updateOrderStatus(req.params.id, req.body.status || order.status);

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
