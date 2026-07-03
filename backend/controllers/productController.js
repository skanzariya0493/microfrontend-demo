const { nextId, products } = require('../models/dataStore');
const { readJsonBody, sendJson } = require('../utils/http');

function getProducts(req, res) {
  sendJson(res, 200, { data: products });
}

function getProductById(req, res, id) {
  const product = products.find((item) => item.id === id);

  if (!product) {
    sendJson(res, 404, { message: 'Product not found' });
    return;
  }

  sendJson(res, 200, { data: product });
}

async function createProduct(req, res) {
  const body = await readJsonBody(req);
  const product = {
    id: nextId('PRD', products),
    name: body.name,
    description: body.description || '',
    price: Number(body.price || 0),
    stock: Number(body.stock || 0),
  };

  const error = validateProduct(product);
  if (error) {
    sendJson(res, 400, { message: error });
    return;
  }

  products.push(product);
  sendJson(res, 201, { message: 'Product created', data: product });
}

async function updateProduct(req, res, id) {
  const productIndex = products.findIndex((item) => item.id === id);

  if (productIndex === -1) {
    sendJson(res, 404, { message: 'Product not found' });
    return;
  }

  const body = await readJsonBody(req);
  const updatedProduct = {
    ...products[productIndex],
    ...body,
    price: body.price === undefined ? products[productIndex].price : Number(body.price),
    stock: body.stock === undefined ? products[productIndex].stock : Number(body.stock),
  };

  const error = validateProduct(updatedProduct);
  if (error) {
    sendJson(res, 400, { message: error });
    return;
  }

  products[productIndex] = updatedProduct;
  sendJson(res, 200, { message: 'Product updated', data: updatedProduct });
}

function deleteProduct(req, res, id) {
  const productIndex = products.findIndex((item) => item.id === id);

  if (productIndex === -1) {
    sendJson(res, 404, { message: 'Product not found' });
    return;
  }

  const [deletedProduct] = products.splice(productIndex, 1);
  sendJson(res, 200, { message: 'Product deleted', data: deletedProduct });
}

function validateProduct(product) {
  if (!product.name) {
    return 'Product name is required';
  }

  if (Number.isNaN(product.price) || product.price < 0) {
    return 'Product price must be a positive number';
  }

  if (Number.isNaN(product.stock) || product.stock < 0) {
    return 'Product stock must be a positive number';
  }

  return '';
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
};
