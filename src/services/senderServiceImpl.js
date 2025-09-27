const crypto = require('crypto');
const SenderService = require('./SenderService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Roles = require('../models/Roles');
const Status = require('../models/Status');
const OrderRequestValidator = require('../validators/orderRequestValidator');
const FundOrderRequestValidator = require('../validators/fundOrderRequestValidator');
const ConfirmReceiptRequestValidator = require('../validators/confirmReceiptRequestValidator');
const CancelOrderRequestValidator = require('../validators/cancelOrderValidator');
const TrackOrderRequestValidator = require('../validators/trackOrderRequestValidator');
const SuiEscrowService = require('./suiEscrowService');
const ProductServiceImpl = require('../services/productServiceImpl');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

class SenderServiceImpl extends SenderService {
  constructor(suiEscrowService = new SuiEscrowService(), productService = new ProductServiceImpl()) {
    super();
    this.suiEscrowService = suiEscrowService;
    this.productService = productService;
  }

  async placeOrder(orderRequest, senderId) {
    if (!process.env.VERIFIER_ADDRESS) {
      throw new Error('VERIFIER_ADDRESS environment variable is required');
    }
    const validatedRequest = OrderRequestValidator.validate(orderRequest);

    const sender = await User.findById(senderId);
    if (!sender || sender.role !== Roles.SENDER) throw new Error('Invalid sender');

    let totalPrice = 0;
    let vendorID = null;
    const products = [];

    for (const item of validatedRequest.products) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.quantityAvailable < item.quantity) throw new Error(`Insufficient stock for product ${product.name}`);

      if (!vendorID) {
        vendorID = product.vendor;
      } else if (vendorID.toString() !== product.vendor.toString()) {
        throw new Error('All products must be from the same vendor');
      }

      totalPrice += product.price * item.quantity;
      products.push({ productID: product._id, quantity: item.quantity });

      await this.productService.updateStock(product._id, product.quantityAvailable - item.quantity);
    }

    const vendor = await User.findById(vendorID);
    if (!vendor || vendor.role !== Roles.VENDOR) throw new Error('Invalid vendor');

    const unlockKey = crypto.randomBytes(16).toString('hex');

    const order = await Order.create({
      senderID,
      vendorID,
      products,
      totalPrice,
      status: Status.PENDING,
      trustlessSwapID: validatedRequest.trustlessSwapID || null,
      unlockKey,
      verifierAddress: process.env.VERIFIER_ADDRESS,
    });

    return order;
  }

  async fundOrder(fundRequest, senderId) {
    if (!process.env.VERIFIER_PRIVATE_KEY) {
      throw new Error('VERIFIER_PRIVATE_KEY environment variable is required');
    }
    const validatedRequest = FundOrderRequestValidator.validate(fundRequest);
    const { orderId, amount, senderWalletPrivateKey } = validatedRequest;

    const order = await Order.findById(orderId).populate('vendorID');
    if (!order) throw new Error('Order not found');
    if (order.senderID.toString() !== senderId.toString()) throw new Error('Unauthorized');
    if (order.status !== Status.PENDING) throw new Error('Order not in pending state');
    if (order.totalPrice !== amount) throw new Error('Amount does not match order total');

    const sender = await User.findById(senderId);
    if (!sender) throw new Error('Sender not found');

    const senderKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(senderWalletPrivateKey, 'hex'));
    const trustlessSwapID = await this.suiEscrowService.createEscrow(
      senderKeypair,
      sender.walletAddress,
      order.vendorID.walletAddress,
      order.verifierAddress,
      amount,
      order.unlockKey
    );

    order.trustlessSwapID = trustlessSwapID;
    order.status = Status.RECEIVED;
    await order.save();

    return order;
  }

  async trackOrder(trackRequest, senderId) {
    const validatedRequest = TrackOrderRequestValidator.validate(trackRequest);
    const { orderId } = validatedRequest;

    const order = await Order.findById(orderId).populate('products.productID vendorID');
    if (!order) throw new Error('Order not found');
    if (order.senderID.toString() !== senderId.toString()) throw new Error('Unauthorized');

    return order;
  }

  async confirmReceipt(confirmRequest, senderId) {
    if (!process.env.VERIFIER_PRIVATE_KEY) {
      throw new Error('VERIFIER_PRIVATE_KEY environment variable is required');
    }
    const validatedRequest = ConfirmReceiptRequestValidator.validate(confirmRequest);
    const { orderId, unlockKey } = validatedRequest;

    const order = await Order.findById(orderId).populate('vendorID');
    if (!order) throw new Error('Order not found');
    if (order.senderID.toString() !== senderId.toString()) throw new Error('Unauthorized');
    if (order.status !== Status.PROOF_UPLOADED) throw new Error('Proof not uploaded');
    if (order.unlockKey !== unlockKey) throw new Error('Invalid unlock key');

    const verifierKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(process.env.VERIFIER_PRIVATE_KEY, 'hex'));
    const txDigest = await this.suiEscrowService.verifyAndRelease(
      verifierKeypair,
      order.verifierAddress,
      order.trustlessSwapID,
      order.unlockKey,
      order.totalPrice
    );

    order.status = Status.DELIVERED;
    await order.save();
    return { order, txDigest };
  }

  async cancelOrder(cancelRequest, senderId) {
    const validatedRequest = CancelOrderRequestValidator.validate(cancelRequest);
    const { orderId, senderWalletPrivateKey } = validatedRequest;

    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.senderID.toString() !== senderId.toString()) throw new Error('Unauthorized');
    if (order.status !== Status.PENDING && order.status !== Status.RECEIVED) {
      throw new Error('Cannot cancel order in this state');
    }

    const sender = await User.findById(senderId);
    if (!sender) throw new Error('Sender not found');

    const senderKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(senderWalletPrivateKey, 'hex'));
    const txDigest = await this.suiEscrowService.cancelEscrow(
      senderKeypair,
      sender.walletAddress,
      order.trustlessSwapID
    );

    for (const item of order.products) {
      const product = await Product.findById(item.productID);
      if (product) {
        await this.productService.updateStock(product._id, product.quantityAvailable + item.quantity);
      }
    }

    order.status = Status.CANCELLED;
    await order.save();
    return { order, txDigest };
  }
}

module.exports =  SenderServiceImpl;
