const { nextId, orders, products } = require('../models/dataStore');
const { readJsonBody, sendJson } = require('../utils/http');

function getOrders(req, res) {
  sendJson(res, 200, { data: orders });
}

function getOrderById(req, res, id) {
  const order = orders.find((item) => item.id === id);

  if (!order) {
    sendJson(res, 404, { message: 'Order not found' });
    return;
  }

  sendJson(res, 200, { data: order });
}

async function createOrder(req, res) {
  const body = await readJsonBody(req);
  const items = normalizeItems(body.items || []);
  const error = validateOrder(body, items);

  if (error) {
    sendJson(res, 400, { message: error });
    return;
  }

  const order = {
    id: nextId('ORD', orders),
    customerName: body.customerName || req.user.name,
    items,
    status: body.status || 'pending',
    total: calculateTotal(items),
  };

  orders.push(order);
  sendJson(res, 201, { message: 'Order created', data: order });
}

async function updateOrder(req, res, id) {
  const orderIndex = orders.findIndex((item) => item.id === id);

  if (orderIndex === -1) {
    sendJson(res, 404, { message: 'Order not found' });
    return;
  }

  const body = await readJsonBody(req);
  const items = body.items ? normalizeItems(body.items) : orders[orderIndex].items;
  const updatedOrder = {
    ...orders[orderIndex],
    ...body,
    items,
    total: calculateTotal(items),
  };

  const error = validateOrder(updatedOrder, items);
  if (error) {
    sendJson(res, 400, { message: error });
    return;
  }

  orders[orderIndex] = updatedOrder;
  sendJson(res, 200, { message: 'Order updated', data: updatedOrder });
}

function deleteOrder(req, res, id) {
  const orderIndex = orders.findIndex((item) => item.id === id);

  if (orderIndex === -1) {
    sendJson(res, 404, { message: 'Order not found' });
    return;
  }

  const [deletedOrder] = orders.splice(orderIndex, 1);
  sendJson(res, 200, { message: 'Order deleted', data: deletedOrder });
}

function normalizeItems(items) {
  return items.map((item) => {
    const product = products.find((productItem) => productItem.id === item.productId);

    return {
      productId: item.productId,
      quantity: Number(item.quantity || 1),
      price: Number(item.price ?? product?.price ?? 0),
    };
  });
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function validateOrder(order, items) {
  if (!order.customerName) {
    return 'Customer name is required';
  }

  if (!Array.isArray(items) || items.length === 0) {
    return 'Order items are required';
  }

  const invalidItem = items.find((item) => !item.productId || item.quantity <= 0 || item.price < 0);
  if (invalidItem) {
    return 'Each order item needs productId, positive quantity, and valid price';
  }

  return '';
}

module.exports = {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrder,
};
