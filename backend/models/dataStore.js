const users = [
  {
    id: 'USR-1',
    name: 'Suresh',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
];

const products = [
  {
    id: 'PRD-101',
    name: 'Wireless Keyboard',
    description: 'Compact keyboard for daily work.',
    price: 69,
    stock: 14,
  },
  {
    id: 'PRD-204',
    name: 'USB-C Dock',
    description: 'Multi-port dock for laptops.',
    price: 129,
    stock: 8,
  },
];

const orders = [
  {
    id: 'ORD-1001',
    customerName: 'Suresh',
    items: [{ productId: 'PRD-101', quantity: 1, price: 69 }],
    status: 'pending',
    total: 69,
  },
];

function nextId(prefix, collection) {
  const nextNumber = collection.length + 1001;
  return `${prefix}-${nextNumber}`;
}

module.exports = {
  users,
  products,
  orders,
  nextId,
};
