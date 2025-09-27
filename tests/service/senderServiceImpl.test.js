const mongoose = require('mongoose');
const crypto = require('crypto');
const SenderServiceImpl = require('../../src/services/senderServiceImpl');
const ProductService = require('../../src/services/productServiceImpl');
const SuiEscrowService = require('../../src/services/suiEscrowService');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const Roles = require('../../src/models/Roles');
const Status = require('../../src/models/Status');
const connectDB = require('../../src/config/db');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

jest.setTimeout(30000);
jest.mock('../../src/services/productServiceImpl');
jest.mock('../../src/services/suiEscrowService');

describe('SenderServiceImpl (persistent MongoDB)', () => {
  let senderService;
  let productServiceMock;
  let suiEscrowServiceMock;
  let senderId;
  let vendorId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.VERIFIER_ADDRESS = '0xSOME_VERIFIER_ADDRESS';
    process.env.VERIFIER_PRIVATE_KEY = Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex');
    try {
      await connectDB();
      console.log('Connected to persistent test DB (cambia_test) for manual inspection.');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    productServiceMock = {
      updateStock: jest.fn(),
    };
    suiEscrowServiceMock = {
      createEscrow: jest.fn().mockResolvedValue('swap123'),
      verifyAndRelease: jest.fn().mockResolvedValue('txDigest123'),
      cancelEscrow: jest.fn().mockResolvedValue('txDigest456'),
    };
    ProductService.mockImplementation(() => productServiceMock);
    SuiEscrowService.mockImplementation(() => suiEscrowServiceMock);
    senderService = new SenderServiceImpl(suiEscrowServiceMock, productServiceMock);
    jest.clearAllMocks();

    await User.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();

    const sender = await User.create({
      firstName: 'Test',
      lastName: 'Sender',
      email: `sender+${Date.now()}@example.com`,
      phone: '0800000000',
      walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
      address: '123 Sender St',
      role: Roles.SENDER,
      password: 'hashedPassword',
    });
    senderId = sender._id;

    const vendor = await User.create({
      firstName: 'Test',
      lastName: 'Vendor',
      email: `vendor+${Date.now()}@example.com`,
      phone: '0900000000',
      walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
      address: '456 Vendor St',
      role: Roles.VENDOR,
      password: 'hashedPassword',
    });
    vendorId = vendor._id;
  });

  afterEach(async () => {
    await User.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();
  });

  describe('placeOrder', () => {
    it('should place an order with valid products and stock', async () => {
      // Arrange
      const product1 = await Product.create({
        name: 'Product 1',
        description: 'Test product 1',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const product2 = await Product.create({
        name: 'Product 2',
        description: 'Test product 2',
        price: 200,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const orderRequest = {
        products: [
          { productId: product1._id.toString(), quantity: 2 },
          { productId: product2._id.toString(), quantity: 1 },
        ],
        trustlessSwapID: 'swap123',
      };
      productServiceMock.updateStock
        .mockResolvedValueOnce({ ...product1.toObject(), quantityAvailable: 8 })
        .mockResolvedValueOnce({ ...product2.toObject(), quantityAvailable: 4 });

      // Act
      const order = await senderService.placeOrder(orderRequest, senderId);

      // Assert
      expect(order).toHaveProperty('_id');
      expect(order.senderID.toString()).toBe(senderId.toString());
      expect(order.vendorID.toString()).toBe(vendorId.toString());
      expect(order.status).toBe(Status.PENDING);
      expect(order.totalPrice).toBe(100 * 2 + 200 * 1); // 400
      expect(order.products).toEqual([
        { productID: product1._id, quantity: 2 },
        { productID: product2._id, quantity: 1 },
      ]);
      expect(order.trustlessSwapID).toBe('swap123');
      expect(order.unlockKey).toHaveLength(32);
      expect(productServiceMock.updateStock).toHaveBeenCalledTimes(2);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product1._id, 8);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product2._id, 4);
    });

    it('should throw error for invalid sender', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }] };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, new mongoose.Types.ObjectId()))
        .rejects.toThrow('Invalid sender');
    });

    it('should throw error for invalid product ID', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: 'invalid-id', quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, senderId))
        .rejects.toThrow('Product invalid-id not found');
    });

    it('should throw error for insufficient stock', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 10 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, senderId))
        .rejects.toThrow(`Insufficient stock for product ${product.name}`);
    });

    it('should throw error for products from different vendors', async () => {
      // Arrange
      const otherVendor = await User.create({
        firstName: 'Other',
        lastName: 'Vendor',
        email: `other+${Date.now()}@example.com`,
        phone: '0900000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '456 Other St',
        role: Roles.VENDOR,
        password: 'hashedPassword',
      });
      const product1 = await Product.create({
        name: 'Product 1',
        description: 'Test product 1',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const product2 = await Product.create({
        name: 'Product 2',
        description: 'Test product 2',
        price: 200,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const orderRequest = {
        products: [
          { productId: product1._id.toString(), quantity: 2 },
          { productId: product2._id.toString(), quantity: 1 },
        ],
        trustlessSwapID: 'swap123',
      };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, senderId))
        .rejects.toThrow('All products must be from the same vendor');
    });

    it('should throw error for invalid order request', async () => {
      // Arrange
      const orderRequest = { products: [] };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, senderId))
        .rejects.toThrow(/Order validation failed: products: Array must contain at least 1 item/);
    });

    it('should throw error for missing VERIFIER_ADDRESS', async () => {
      // Arrange
      delete process.env.VERIFIER_ADDRESS;
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(senderService.placeOrder(orderRequest, senderId))
        .rejects.toThrow('VERIFIER_ADDRESS environment variable is required');
    });
  });

  describe('fundOrder', () => {
    it('should fund an order and update status', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
        verifierAddress: process.env.VERIFIER_ADDRESS,
      });
      const fundRequest = {
        orderId: order._id.toString(),
        amount: 200,
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };
      const sender = await User.findById(senderId);

      // Act
      const updatedOrder = await senderService.fundOrder(fundRequest, senderId);

      // Assert
      expect(updatedOrder.status).toBe(Status.RECEIVED);
      expect(updatedOrder.trustlessSwapID).toBe('swap123');
      expect(suiEscrowServiceMock.createEscrow).toHaveBeenCalledWith(
        expect.any(Object), // senderKeypair
        sender.walletAddress,
        expect.any(String), // vendor.walletAddress
        process.env.VERIFIER_ADDRESS,
        200,
        'secureKey'
      );
    });

    it('should throw error for invalid order ID', async () => {
      // Arrange
      const fundRequest = { orderId: 'invalid-id', amount: 200, senderWalletPrivateKey: 'key' };

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId))
        .rejects.toThrow('Order not found');
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: new mongoose.Types.ObjectId(),
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        unlockKey: 'secureKey',
      });
      const fundRequest = {
        orderId: order._id.toString(),
        amount: 200,
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId))
        .rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-pending order', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
        unlockKey: 'secureKey',
      });
      const fundRequest = {
        orderId: order._id.toString(),
        amount: 200,
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId))
        .rejects.toThrow('Order not in pending state');
    });

    it('should throw error for incorrect amount', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        unlockKey: 'secureKey',
      });
      const fundRequest = {
        orderId: order._id.toString(),
        amount: 300,
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId))
        .rejects.toThrow('Amount does not match order total');
    });

    it('should throw error for missing VERIFIER_PRIVATE_KEY', async () => {
      // Arrange
      delete process.env.VERIFIER_PRIVATE_KEY;
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        unlockKey: 'secureKey',
      });
      const fundRequest = {
        orderId: order._id.toString(),
        amount: 200,
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.fundOrder(fundRequest, senderId))
        .rejects.toThrow('VERIFIER_PRIVATE_KEY environment variable is required');
    });
  });

  describe('trackOrder', () => {
    it('should track an order', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        unlockKey: 'secureKey',
      });
      const trackRequest = { orderId: order._id.toString() };

      // Act
      const result = await senderService.trackOrder(trackRequest, senderId);

      // Assert
      expect(result._id.toString()).toBe(order._id.toString());
      expect(result.senderID.toString()).toBe(senderId.toString());
    });

    it('should throw error for invalid order ID', async () => {
      // Arrange
      const trackRequest = { orderId: 'invalid-id' };

      // Act & Assert
      await expect(senderService.trackOrder(trackRequest, senderId))
        .rejects.toThrow('Order not found');
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: new mongoose.Types.ObjectId(),
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        unlockKey: 'secureKey',
      });
      const trackRequest = { orderId: order._id.toString() };

      // Act & Assert
      await expect(senderService.trackOrder(trackRequest, senderId))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('confirmReceipt', () => {
    it('should confirm receipt and release escrow', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PROOF_UPLOADED,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
        verifierAddress: process.env.VERIFIER_ADDRESS,
      });
      const confirmRequest = { orderId: order._id.toString(), unlockKey: 'secureKey' };

      // Act
      const result = await senderService.confirmReceipt(confirmRequest, senderId);

      // Assert
      expect(result.order.status).toBe(Status.DELIVERED);
      expect(result.txDigest).toBe('txDigest123');
      expect(suiEscrowServiceMock.verifyAndRelease).toHaveBeenCalledWith(
        expect.any(Object), // verifierKeypair
        process.env.VERIFIER_ADDRESS,
        'swap123',
        'secureKey',
        200
      );
    });

    it('should throw error for invalid order ID', async () => {
      // Arrange
      const confirmRequest = { orderId: 'invalid-id', unlockKey: 'secureKey' };

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId))
        .rejects.toThrow('Order not found');
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: new mongoose.Types.ObjectId(),
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PROOF_UPLOADED,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const confirmRequest = { orderId: order._id.toString(), unlockKey: 'secureKey' };

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId))
        .rejects.toThrow('Unauthorized');
    });

    it('should throw error for invalid unlock key', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PROOF_UPLOADED,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const confirmRequest = { orderId: order._id.toString(), unlockKey: 'wrongKey' };

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId))
        .rejects.toThrow('Invalid unlock key');
    });

    it('should throw error for non-PROOF_UPLOADED order', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const confirmRequest = { orderId: order._id.toString(), unlockKey: 'secureKey' };

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId))
        .rejects.toThrow('Proof not uploaded');
    });

    it('should throw error for missing VERIFIER_PRIVATE_KEY', async () => {
      // Arrange
      delete process.env.VERIFIER_PRIVATE_KEY;
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PROOF_UPLOADED,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const confirmRequest = { orderId: order._id.toString(), unlockKey: 'secureKey' };

      // Act & Assert
      await expect(senderService.confirmReceipt(confirmRequest, senderId))
        .rejects.toThrow('VERIFIER_PRIVATE_KEY environment variable is required');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order and restore stock', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const cancelRequest = {
        orderId: order._id.toString(),
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };
      productServiceMock.updateStock.mockResolvedValue({ ...product.toObject(), quantityAvailable: 12 });
      const sender = await User.findById(senderId);

      // Act
      const result = await senderService.cancelOrder(cancelRequest, senderId);

      // Assert
      expect(result.order.status).toBe(Status.CANCELLED);
      expect(result.txDigest).toBe('txDigest456');
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product._id, 12);
      expect(suiEscrowServiceMock.cancelEscrow).toHaveBeenCalledWith(
        expect.any(Object), // senderKeypair
        sender.walletAddress,
        'swap123'
      );
    });

    it('should throw error for invalid order ID', async () => {
      // Arrange
      const cancelRequest = { orderId: 'invalid-id', senderWalletPrivateKey: 'key' };

      // Act & Assert
      await expect(senderService.cancelOrder(cancelRequest, senderId))
        .rejects.toThrow('Order not found');
    });

    it('should throw error for unauthorized sender', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: new mongoose.Types.ObjectId(),
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const cancelRequest = {
        orderId: order._id.toString(),
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.cancelOrder(cancelRequest, senderId))
        .rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-cancelable order state', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const order = await Order.create({
        senderID: senderId,
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.DELIVERED,
        trustlessSwapID: 'swap123',
        unlockKey: 'secureKey',
      });
      const cancelRequest = {
        orderId: order._id.toString(),
        senderWalletPrivateKey: Buffer.from(Ed25519Keypair.generate().getSecretKey()).toString('hex'),
      };

      // Act & Assert
      await expect(senderService.cancelOrder(cancelRequest, senderId))
        .rejects.toThrow('Cannot cancel order in this state');
    });
  });
});