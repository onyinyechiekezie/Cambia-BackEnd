coconst mongoose = require('mongoose');
const SenderServiceImpl = require('../services/SenderServiceImpl');
const Sender = require('../models/Sender');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Roles = require('../models/Roles');
const Status = require('../models/OrderStatus');
const OrderRequest = require('../../dto/request/OrderRequest');
const FundOrderRequest = require('../../dto/request/FundOrderRequest');
const TrackOrderRequest = require('../../dto/request/TrackOrderRequest');
const ConfirmReceiptRequest = require('../../dto/request/ConfirmReceiptRequest');
const CancelOrderRequest = require('../../dto/request/CancelOrderRequest');
const SuiEscrowService = require('../services/SuiEscrowService');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const connectDB = require('../config/db');

// Mock SuiEscrowService
jest.mock('../services/SuiEscrowService');

describe('SenderServiceImpl', () => {
  let senderService;
  let senderId;
  let vendorId;
  let productId;
  let orderId;
  let trustlessSwapId = '0x1234567890abcdef';
  let unlockKey = 'randomkey123';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.VERIFIER_PRIVATE_KEY = 'verifierPrivateKey';
    process.env.JWT_SECRET = 'test-secret';
    await connectDB();
    console.log('Connected to persistent test DB for manual inspection.');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    senderService = new SenderServiceImpl();
    jest.clearAllMocks();

    // Clear collections
    await Sender.deleteMany({}).exec();
    await Vendor.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();

    // Setup test data
    const sender = await Sender.create({
      _id: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      phone: '1234567890',
      walletAddress: '0xsender',
      address: '123 Main St',
      role: Roles.SENDER,
    });
    senderId = sender._id;

    const vendor = await Vendor.create({
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Jane',
      lastName: 'Vendor',
      email: 'jane@example.com',
      password: 'hashedpassword',
      phone: '0987654321',
      walletAddress: '0xvendor',
      address: '456 Market St',
      role: Roles.VENDOR,
    });
    vendorId = vendor._id;

    const product = await Product.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Apple',
      description: 'Fresh apple',
      price: 100,
      quantityAvailable: 50,
      unit: 'kg',
      category: new mongoose.Types.ObjectId(),
      vendor: vendorId,
    });
    productId = product._id;
  });

  afterEach(async () => {
    await Sender.deleteMany({}).exec();
    await Vendor.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const orderRequest = new OrderRequest(
        [{ productId: productId.toString(), quantity: 2 }],
        null
      );

      // Act
      const order = await senderService.createOrder(orderRequest, senderId);

      // Assert
      expect(order).toBeDefined();
      expect(order.senderID.toString()).toBe(senderId.toString());
      expect(order.vendorID.toString()).toBe(vendorId.toString());
      expect(order.products).toHaveLength(1);
      expect(order.products[0].productID.toString()).toBe(productId.toString());
      expect(order.products[0].quantity).toBe(2);
      expect(order.totalPrice).toBe(200);
      expect(order.status).toBe(Status.PENDING);
      expect(order.unlockKey).toBeDefined();

      const product = await Product.findById(productId);
      expect(product.quantityAvailable).toBe(48); // 50 - 2
    });

    it('should throw error for invalid sender', async () => {
      // Arrange
      const orderRequest = new OrderRequest(
        [{ productId: productId.toString(), quantity: 2 }],
        null
      );
      const invalidSenderId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(senderService.createOrder(orderRequest, invalidSenderId)).rejects.toThrow('Invalid sender');
    });

    it('should throw error for invalid product', async () => {
      // Arrange
      const orderRequest = new OrderRequest(
        [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 2 }],
        null
      );

      // Act & Assert
      await expect(senderService.createOrder(orderRequest, senderId)).rejects.toThrow(/Product .* not found/);
    });

    it('should throw error for insufficient stock', async () => {
      // Arrange
      const orderRequest = new OrderRequest(
        [{ productId: productId.toString(), quantity: 100 }],
        null
      );

      // Act & Assert
      await expect(senderService.createOrder(orderRequest, senderId)).rejects.toThrow(/Insufficient stock/);
    });

    it('should throw error for multiple vendors', async () => {
      // Arrange
      const anotherVendor = await Vendor.create({
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Bob',
        lastName: 'Vendor',
        email: 'bob@example.com',
        password: 'hashedpassword',
        phone: '1112223333',
        walletAddress: '0xvendor2',
        address: '789 High St',
        role: Roles.VENDOR,
      });
      const anotherProduct = await Product.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Orange',
        description: 'Fresh orange',
        price: 150,
        quantityAvailable: 30,
        unit: 'kg',
        category: new mongoose.Types.ObjectId(),
        vendor: anotherVendor._id,
      });

      const orderRequest = new OrderRequest(
        [
          { productId: productId.toString(), quantity: 2 },
          { productId: anotherProduct._id.toString(), quantity: 1 },
        ],
        null
      );

      // Act & Assert
      await expect(senderService.createOrder(orderRequest, senderId)).rejects.toThrow('All products must be from the same vendor');
    });
  });

  describe('fundOrder', () => {
    beforeEach(async () => {
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: productId, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        trustlessSwapID: null,
        unlockKey,
        verifierAddress: '0xverifier',
      });
      orderId = order._id;

      // Mock SuiEscrowService.createEscrow
      SuiEscrowService.prototype.createEscrow.mockResolvedValue(trustlessSwapId);
    });

    it('should fund an order successfully', async () => {
      // Arrange
      const fundRequest = new FundOrderRequest(
        orderId.toString(),
        200,
        'senderPrivateKey'
      );

      // Act
      const order = await senderService.fundOrder(fundRequest, senderId);

      // Assert
      expect(order).toBeDefined();
      expect(order.status).toBe(Status.RECEIVED);
      expect(order.trustlessSwapID).toBe(trustlessSwapId);
      expect(SuiEscrowService.prototype.createEscrow).toHaveBeenCalledWith(
        expect.any(Object), // Ed25519Keypair
        '0xsender',
        '0xvendor',
        '0xverifier',
        200,
        unlockKey
      );
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const fundRequest = new FundOrderRequest(
        orderId.toString(),
        200,
        'senderPrivateKey'
      );
      const otherSenderId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, otherSenderId)).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-pending order', async () => {
      // Arrange
      await Order.findByIdAndUpdate(orderId, { status: Status.RECEIVED });
      const fundRequest = new FundOrderRequest(
        orderId.toString(),
        200,
        'senderPrivateKey'
      );

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId)).rejects.toThrow('Order not in pending state');
    });

    it('should throw error for incorrect amount', async () => {
      // Arrange
      const fundRequest = new FundOrderRequest(
        orderId.toString(),
        300,
        'senderPrivateKey'
      );

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId)).rejects.toThrow('Amount does not match order total');
    });

    it('should throw error for invalid sender wallet', async () => {
      // Arrange
      const fundRequest = new FundOrderRequest(
        orderId.toString(),
        200,
        'invalidPrivateKey'
      );

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId)).rejects.toThrow('Sender not found');
    });
  });

  describe('trackOrder', () => {
    beforeEach(async () => {
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: productId, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
        trustlessSwapID: trustlessSwapId,
        unlockKey,
        verifierAddress: '0xverifier',
      });
      orderId = order._id;
    });

    it('should track an order successfully', async () => {
      // Arrange
      const trackRequest = new TrackOrderRequest(orderId.toString());

      // Act
      const order = await senderService.trackOrder(trackRequest, senderId);

      // Assert
      expect(order).toBeDefined();
      expect(order._id.toString()).toBe(orderId.toString());
      expect(order.status).toBe(Status.RECEIVED);
      expect(order.products[0].productID.name).toBe('Apple');
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const trackRequest = new TrackOrderRequest(orderId.toString());
      const otherSenderId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(senderService.trackOrder(trackRequest, otherSenderId)).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-existent order', async () => {
      // Arrange
      const trackRequest = new TrackOrderRequest(new mongoose.Types.ObjectId().toString());

      // Act & Assert
      await expect(senderService.trackOrder(trackRequest, senderId)).rejects.toThrow('Order not found');
    });
  });

  describe('confirmReceipt', () => {
    beforeEach(async () => {
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: productId, quantity: 2 }],
        totalPrice: 200,
        status: Status.PROOF_UPLOADED,
        trustlessSwapID: trustlessSwapId,
        unlockKey,
        verifierAddress: '0xverifier',
      });
      orderId = order._id;

      // Mock SuiEscrowService.verifyAndRelease
      SuiEscrowService.prototype.verifyAndRelease.mockResolvedValue('0xtxDigest');
    });

    it('should confirm receipt successfully', async () => {
      // Arrange
      const confirmRequest = new ConfirmReceiptRequest(orderId.toString(), unlockKey);

      // Act
      const result = await senderService.confirmReceipt(confirmRequest, senderId);

      // Assert
      expect(result.order).toBeDefined();
      expect(result.order.status).toBe(Status.DELIVERED);
      expect(result.txDigest).toBe('0xtxDigest');
      expect(SuiEscrowService.prototype.verifyAndRelease).toHaveBeenCalledWith(
        expect.any(Object), // Ed25519Keypair
        '0xverifier',
        trustlessSwapId,
        unlockKey,
        200
      );
    });

    it('should throw error for invalid unlock key', async () => {
      // Arrange
      const confirmRequest = new ConfirmReceiptRequest(orderId.toString(), 'wrongkey');

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId)).rejects.toThrow('Invalid unlock key');
    });

    it('should throw error for non-proof_uploaded order', async () => {
      // Arrange
      await Order.findByIdAndUpdate(orderId, { status: Status.RECEIVED });
      const confirmRequest = new ConfirmReceiptRequest(orderId.toString(), unlockKey);

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId)).rejects.toThrow('Proof not uploaded');
    });
  });

  describe('cancelOrder', () => {
    beforeEach(async () => {
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: productId, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
        trustlessSwapID: trustlessSwapId,
        unlockKey,
        verifierAddress: '0xverifier',
      });
      orderId = order._id;

      // Mock SuiEscrowService.cancelEscrow
      SuiEscrowService.prototype.cancelEscrow.mockResolvedValue('0xtxDigest');
    });

    it('should cancel an order successfully', async () => {
      // Arrange
      const cancelRequest = new CancelOrderRequest(orderId.toString(), 'senderPrivateKey');

      // Act
      const result = await senderService.cancelOrder(cancelRequest, senderId);

      // Assert
      expect(result.order).toBeDefined();
      expect(result.order.status).toBe(Status.CANCELLED);
      expect(result.txDigest).toBe('0xtxDigest');
      expect(SuiEscrowService.prototype.cancelEscrow).toHaveBeenCalledWith(
        expect.any(Object), // Ed25519Keypair
        '0xsender',
        trustlessSwapId
      );

      const product = await Product.findById(productId);
      expect(product.quantityAvailable).toBe(52); // 50 - 2 + 2
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const cancelRequest = new CancelOrderRequest(orderId.toString(), 'senderPrivateKey');
      const otherSenderId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(senderService.cancelOrder(cancelRequest, otherSenderId)).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-cancelable order', async () => {
      // Arrange
      await Order.findByIdAndUpdate(orderId, { status: Status.DELIVERED });
      const cancelRequest = new CancelOrderRequest(orderId.toString(), 'senderPrivateKey');

      // Act & Assert
      await expect(senderService.cancelOrder(cancelRequest, senderId)).rejects.toThrow('Cannot cancel order in this state');
    });
  });
});
