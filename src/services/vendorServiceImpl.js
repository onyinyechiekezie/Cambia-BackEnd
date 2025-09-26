// services/impl/vendorServiceImpl.js
const VendorService = require('./vendorService');
const ProductService = require('./productServiceImpl');
const Order = require('../models/Order');
const Product = require('../models/Product');

class VendorServiceImpl extends VendorService {
  async addProduct(vendorId, productData) {
    return await ProductService.createProduct(vendorId, productData);
  }

  async updateProductStock(vendorId, productId, newQuantity) {
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) throw new Error("Product not found or not owned by vendor");
    return await ProductService.updateStock(productId, newQuantity);
  }

  async updateProductPrice(vendorId, productId, newPrice) {
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) throw new Error("Product not found or not owned by vendor");
    return await ProductService.updatePrice(productId, newPrice);
  }

  async deleteProduct(vendorId, productId) {
    return await ProductService.deleteProduct(productId, vendorId);
  }

<<<<<<< HEAD
=======

>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
  async getVendorProducts(vendorId) {
    return await ProductService.getVendorProducts(vendorId);
  }

<<<<<<< HEAD
  async receiveOrder(vendorId, orderId) {
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) throw new Error("Order not found or not assigned to vendor");
    order.status = 'RECEIVED';
    return await order.save();
  }

  async prepareGoods(vendorId, orderId) {
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) throw new Error("Order not found or not assigned to vendor");
    order.status = 'PREPARING';
    return await order.save();
  }

  async uploadProof(vendorId, orderId, proofUrl) {
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) throw new Error("Order not found or not assigned to vendor");
    order.proofOfPackaging = proofUrl;
    order.status = 'PACKAGED';
    return await order.save();
  }
=======
  // vendorServiceImpl.js

async receiveOrder(vendorId, orderId) {
  const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
  if (!order) throw new Error("Order not found or not assigned to vendor");
  order.status = 'received'; // ✅ matches schema
  return await order.save();
}

async prepareGoods(vendorId, orderId) {
  const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
  if (!order) throw new Error("Order not found or not assigned to vendor");
  order.status = 'prepared'; // ✅ matches schema
  return await order.save();
}

async uploadProof(vendorId, orderId, proofUrl) {
  const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
  if (!order) throw new Error("Order not found or not assigned to vendor");
  order.proofOfPackaging = proofUrl;
  order.status = 'proof_uploaded'; // ✅ matches schema
  return await order.save();
}

>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
}

module.exports = new VendorServiceImpl();
