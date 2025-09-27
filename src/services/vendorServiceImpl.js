const mongoose = require('mongoose');
const VendorService = require('./vendorService');
const ProductService = require('./productServiceImpl');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Roles = require('../models/Roles');
const Status = require('../models/Status');
const OrderRequestValidator = require('../validators/orderRequestValidator');

class VendorServiceImpl extends VendorService {
  constructor(productService = new ProductService()) {
    super();
    this.productService = productService;
  }

  async addProduct(vendorId, productData) {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error('Invalid vendor ID');
    }
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== Roles.VENDOR) {
      throw new Error('Invalid vendor');
    }
    return await this.productService.createProduct(vendorId, productData);
  }

  async updateProductStock(vendorId, productId, newQuantity) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid vendor or product ID');
    }
    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      throw new Error('Quantity must be a non-negative integer');
    }
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) {
      throw new Error('Product not found or not owned by vendor');
    }
    return await this.productService.updateStock(productId, newQuantity);
  }

  async updateProductPrice(vendorId, productId, newPrice) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid vendor or product ID');
    }
    if (typeof newPrice !== 'number' || newPrice <= 0) {
      throw new Error('Price must be a positive number');
    }
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) {
      throw new Error('Product not found or not owned by vendor');
    }
    return await this.productService.updatePrice(productId, newPrice);
  }

  async deleteProduct(vendorId, productId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid vendor or product ID');
    }
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) {
      throw new Error('Product not found or not owned by vendor');
    }
    return await this.productService.deleteProduct(productId, vendorId);
  }

<<<<<<< HEAD
=======

>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
  async getVendorProducts(vendorId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error('Invalid vendor ID');
    }
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== Roles.VENDOR) {
      throw new Error('Invalid vendor');
    }
    return await this.productService.getVendorProducts(vendorId);
  }

<<<<<<< HEAD
  async receiveOrder(vendorId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== Roles.VENDOR) {
      throw new Error('Invalid vendor');
    }
    const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== Status.PENDING) {
      throw new Error('Order must be in PENDING state to be received');
    }
    order.status = Status.RECEIVED;
    return await order.save();
  }

  async prepareGoods(vendorId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== Roles.VENDOR) {
      throw new Error('Invalid vendor');
    }
    const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== Status.RECEIVED) {
      throw new Error('Order must be in RECEIVED state to be prepared');
    }
    order.status = Status.PREPARING;
    return await order.save();
  }

  async uploadProof(vendorId, orderId, proofUrl) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    if (!proofUrl || typeof proofUrl !== 'string') {
      throw new Error('Valid proof URL is required');
    }
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== Roles.VENDOR) {
      throw new Error('Invalid vendor');
    }
    const order = await Order.findOne({ _id: orderId, vendorID: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== Status.PREPARING) {
      throw new Error('Order must be in PREPARING state to upload proof');
    }
    order.proofOfPackaging = proofUrl;
    order.status = Status.PROOF_UPLOADED;
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
