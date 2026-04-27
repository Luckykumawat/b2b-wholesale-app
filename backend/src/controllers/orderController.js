const orderService = require('../services/orderService');
const quotationService = require('../services/quotationService');
const { logActivity } = require('./activityController');
const { createNotification } = require('./notificationController');

const extractBuyerId = (orderOrQuotation) =>
  orderOrQuotation?.buyer?._id || orderOrQuotation?.buyer?.id || orderOrQuotation?.buyer_id || orderOrQuotation?.buyer;

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

    const buyerId = extractBuyerId(quotation);
    const actorId = req.user._id || req.user.id;

    await logActivity(
      orderPayload.createdBy,
      'order_create',
      `Created order from quotation ${quotation.id || quotation._id}`,
      { orderId: createdOrder._id, quotationId: quotation.id || quotation._id }
    );

    // Notify buyer (if admin created the order), or notify admin (if buyer created it)
    if (req.user.role === 'admin' && buyerId) {
      await createNotification(
        buyerId,
        actorId,
        'order_created',
        `Your order has been created from quotation ${String(quotation.id || quotation._id).slice(-6)}`,
        '/buyer/quotes'
      );
    } else if (req.user.role === 'buyer' && quotation.createdBy) {
      await createNotification(
        quotation.createdBy,
        actorId,
        'order_created',
        `Buyer ${req.user.name || 'Buyer'} has placed an order`,
        '/admin/quotations'
      );
    }
    
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

    const actorId = req.user._id || req.user.id;
    const nextStatus = req.body.status || order.status;
    const buyerId = extractBuyerId(order);

    await logActivity(
      userId,
      'order_status_updated',
      `Updated order ${order._id || order.id} status to ${nextStatus}`,
      { orderId: order._id || order.id, status: nextStatus }
    );

    if (buyerId) {
      await createNotification(
        buyerId,
        actorId,
        'order_status_updated',
        `Your order status has been updated to ${String(nextStatus).replace(/_/g, ' ')}`,
        '/buyer/quotes'
      );
    }

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
