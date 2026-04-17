const supabase = require('../config/supabase');
const quotationService = require('./quotationService');

const ORDER_SELECT = '*, buyer:users!orders_buyer_id_fkey(id, name, email)';

const mapOrder = (row) => {
  if (!row) return null;
  const normalizedId = row.id;
  return {
    _id: normalizedId,
    id: normalizedId,
    quotation: row.quotation_id,
    buyer: row.buyer ? {
      _id: row.buyer.id,
      id: row.buyer.id,
      name: row.buyer.name,
      email: row.buyer.email
    } : { _id: row.buyer_id, id: row.buyer_id },
    totalAmount: Number(row.total_amount),
    shippingAddress: row.shipping_address,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    products: []
  };
};

const createOrder = async (payload) => {
  const { quotationId, buyerId, products, totalAmount, shippingAddress, status, createdBy } = payload;
  
  const { data: order, error } = await supabase.from('orders').insert([{
    quotation_id: quotationId,
    buyer_id: buyerId,
    total_amount: totalAmount,
    shipping_address: shippingAddress,
    status: status || 'pending',
    created_by: createdBy
  }]).select().single();
  
  if (error) throw error;
  
  if (products && products.length > 0) {
    const items = products.map(p => ({
      order_id: order.id,
      product_id: p.product,
      quantity: p.quantity,
      price: p.price || p.quotedPrice
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) throw itemsError;
  }
  
  return getOrderById(order.id);
};

const getOrderById = async (id) => {
  const { data: order, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  
  const { data: items, error: itemsError } = await supabase.from('order_items').select('*, product:products(id, name)').eq('order_id', id);
  if (itemsError) throw itemsError;
  
  const mapped = mapOrder(order);
  mapped.products = items.map(i => ({
    product: i.product ? {
      _id: i.product.id,
      id: i.product.id,
      name: i.product.name
    } : { _id: i.product_id, id: i.product_id },
    quantity: i.quantity,
    price: Number(i.price)
  }));
  return mapped;
};

const assembleOrders = async (orders) => {
  if (!orders || orders.length === 0) return [];
  
  const orderIds = orders.map(o => o.id);
  const { data: items, error } = await supabase.from('order_items').select('*, product:products(id, name)').in('order_id', orderIds);
  if (error) throw error;
  
  return orders.map(o => {
    const mapped = mapOrder(o);
    mapped.products = items.filter(i => i.order_id === o.id).map(i => ({
      product: i.product ? {
        _id: i.product.id,
        id: i.product.id,
        name: i.product.name
      } : { _id: i.product_id, id: i.product_id },
      quantity: i.quantity,
      price: Number(i.price)
    }));
    return mapped;
  });
};

const getAllOrders = async (adminId) => {
  const { data: orders, error } = await supabase.from('orders').select(ORDER_SELECT).eq('created_by', adminId);
  if (error) throw error;
  return assembleOrders(orders);
};

const getOrdersByBuyer = async (buyerId) => {
  const { data: orders, error } = await supabase.from('orders').select(ORDER_SELECT).eq('buyer_id', buyerId);
  if (error) throw error;
  return assembleOrders(orders);
};

const updateOrderStatus = async (id, status) => {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('id').single();
  if (error) throw error;
  return getOrderById(id);
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByBuyer,
  updateOrderStatus,
  getOrderById
};
