const VendorService = require('./vendorService');
const ProductService = require('./productServiceImpl');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { OrderStatus } = require('../models/OrderStatus');

class VendorServiceImpl extends VendorService {
  constructor(productService = new ProductService()) {
    super();
    this.productService = productService;
  }

  async addProduct(vendorId, productData) {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error('Invalid vendor ID');
    }
    return await this.productService.createProduct(vendorId, productData);
  }

  async updateProductStock(vendorId, productId, newQuantity) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid vendor or product ID');
    }
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative');
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
    if (newPrice <= 0) {
      throw new Error('Price must be positive');
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

  async getVendorProducts(vendorId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error('Invalid vendor ID');
    }
    return await this.productService.getVendorProducts(vendorId);
  }

  async receiveOrder(vendorId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order must be in PENDING state to be received');
    }
    order.status = OrderStatus.RECEIVED;
    return await order.save();
  }

  async prepareGoods(vendorId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== OrderStatus.RECEIVED) {
      throw new Error('Order must be in RECEIVED state to be prepared');
    }
    order.status = OrderStatus.PREPARING;
    return await order.save();
  }

  async uploadProof(vendorId, orderId, proofUrl) {
    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid vendor or order ID');
    }
    if (!proofUrl || typeof proofUrl !== 'string') {
      throw new Error('Valid proof URL is required');
    }
    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) {
      throw new Error('Order not found or not assigned to vendor');
    }
    if (order.status !== OrderStatus.PREPARING) {
      throw new Error('Order must be in PREPARING state to upload proof');
    }
    order.proofOfPackaging = proofUrl;
    order.status = OrderStatus.PACKAGED;
    return await order.save();
  }
}

module.exports = new VendorServiceImpl();
