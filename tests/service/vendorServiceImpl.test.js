```javascript
const mongoose = require('mongoose');
const crypto = require('crypto');
const VendorServiceImpl = require('../../src/services/VendorServiceImpl');
const ProductService = require('../../src/services/productServiceImpl');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const Roles = require('../../src/models/Roles');
const Status = require('../../src/models/Status');
const OrderRequestValidator = require('../../src/validators/orderRequestValidator');
const connectDB = require('../../src/config/db');

jest.setTimeout(30000);
jest.mock('../../src/services/productServiceImpl');

describe('VendorServiceImpl (persistent MongoDB)', () => {
  let vendorService;
  let productServiceMock;
  let vendorId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
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
      createProduct: jest.fn(),
      updateStock: jest.fn(),
      updatePrice: jest.fn(),
      deleteProduct: jest.fn(),
      getVendorProducts: jest.fn(),
    };
    ProductService.mockImplementation(() => productServiceMock);
    vendorService = new VendorServiceImpl(productServiceMock);
    jest.clearAllMocks();

    await User.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();

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

  describe('addProduct', () => {
    it('should add a product for vendor', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A product for tests',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
      };
      const product = { _id: new mongoose.Types.ObjectId(), vendor: vendorId, ...productData };
      productServiceMock.createProduct.mockResolvedValue(product);

      // Act
      const result = await vendorService.addProduct(vendorId, productData);

      // Assert
      expect(result).toEqual(product);
      expect(productServiceMock.createProduct).toHaveBeenCalledWith(vendorId, productData);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Arrange
      const productData = { name: 'Test Product', price: 100 };

      // Act & Assert
      await expect(vendorService.addProduct('invalid-id', productData))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });
      const productData = { name: 'Test Product', price: 100 };

      // Act & Assert
      await expect(vendorService.addProduct(nonVendor._id, productData))
        .rejects.toThrow('Invalid vendor');
    });
  });

  describe('updateProductStock', () => {
    it('should update product stock', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const updatedProduct = { ...product.toObject(), quantityAvailable: 20 };
      productServiceMock.updateStock.mockResolvedValue(updatedProduct);

      // Act
      const result = await vendorService.updateProductStock(vendorId, product._id, 20);

      // Assert
      expect(result.quantityAvailable).toBe(20);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product._id, 20);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductStock('invalid-id', new mongoose.Types.ObjectId(), 20))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, 'invalid-id', 20))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for negative quantity', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });

      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, product._id, -1))
        .rejects.toThrow('Quantity must be a non-negative integer');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, product._id, 20))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe 'updateProductPrice', () => {
    it('should update product price', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const updatedProduct = { ...product.toObject(), price: 75 };
      productServiceMock.updatePrice.mockResolvedValue(updatedProduct);

      // Act
      const result = await vendorService.updateProductPrice(vendorId, product._id, 75);

      // Assert
      expect(result.price).toBe(75);
      expect(productServiceMock.updatePrice).toHaveBeenCalledWith(product._id, 75);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductPrice('invalid-id', new mongoose.Types.ObjectId(), 75))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, 'invalid-id', 75))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for non-positive price', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });

      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, product._id, 0))
        .rejects.toThrow('Price must be a positive number');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, product._id, 75))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe('getVendorProducts', () => {
    it('should get vendor products', async () => {
      // Arrange
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Vendor Product',
        description: 'Get test',
        price: 200,
        quantityAvailable: 2,
        unit: 'kg',
        vendor: vendorId,
      };
      productServiceMock.getVendorProducts.mockResolvedValue([product]);

      // Act
      const products = await vendorService.getVendorProducts(vendorId);

      // Assert
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(1);
      expect(products[0].vendor.toString()).toBe(vendorId.toString());
      expect(productServiceMock.getVendorProducts).toHaveBeenCalledWith(vendorId);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.getVendorProducts('invalid-id'))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });

      // Act & Assert
      await expect(vendorService.getVendorProducts(nonVendor._id))
        .rejects.toThrow('Invalid vendor');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product owned by vendor', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Delete Product',
        description: 'Delete test',
        price: 30,
        quantityAvailable: 3,
        unit: 'pcs',
        vendor: vendorId,
      });
      productServiceMock.deleteProduct.mockResolvedValue(product);

      // Act
      const deleted = await vendorService.deleteProduct(vendorId, product._id);

      // Assert
      expect(deleted._id.toString()).toBe(product._id.toString());
      expect(productServiceMock.deleteProduct).toHaveBeenCalledWith(product._id, vendorId);
      const found = await Product.findById(product._id);
      expect(found).toBeNull();
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.deleteProduct('invalid-id', new mongoose.Types.ObjectId()))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.deleteProduct(vendorId, 'invalid-id'))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Delete Product',
        description: 'Delete test',
        price: 30,
        quantityAvailable: 3,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.deleteProduct(vendorId, product._id))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe('createOrder', () => {
    it('should create an order with valid products and stock', async () => {
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
      const order = await vendorService.createOrder(vendorId, orderRequest);

      // Assert
      expect(order).toHaveProperty('_id');
      expect(order.vendorID.toString()).toBe(vendorId.toString());
      expect(order.status).toBe(Status.PENDING);
      expect(order.totalPrice).toBe(100 * 2 + 200 * 1); // 400
      expect(order.products).toEqual([
        { productID: product1._id, quantity: 2 },
        { productID: product2._id, quantity: 1 },
      ]);
      expect(order.trustlessSwapID).toBe('swap123');
      expect(productServiceMock.updateStock).toHaveBeenCalledTimes(2);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product1._id, 8);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product2._id, 4);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder('invalid-id', orderRequest))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });
      const orderRequest = { products: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(nonVendor._id, orderRequest))
        .rejects.toThrow('Invalid vendor');
    });

    it('should throw error for invalid product ID', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: 'invalid-id', quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow('Invalid product ID: invalid-id');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Product ${product._id} not found or not owned by vendor`);
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
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Insufficient stock for product ${product.name}: 5 available, 10 requested`);
    });

    it('should throw error for invalid order request', async () => {
      // Arrange
      const orderRequest = { products: [] };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(/Order validation failed: products: Array must contain at least 1 item/);
    });

    it('should throw error for non-integer quantity', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 1.5 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Invalid quantity for product ${product.name}: 1.5`);
    });
  });

  describe('receiveOrder', () => {
    it('should receive an order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act
      const updated = await vendorService.receiveOrder(vendorId, order._id);

      // Assert
      expect(updated.status).toBe(Status.RECEIVED);
      expect(updated._id.toString()).toBe(order._id.toString());
    });

    it('should throw error for invalid vendor ID', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act & Assert
      await expect(vendorService.receiveOrder('invalid-id', order._id))
        .rejects.toThrow('Invalid vendor or order ID');
    });

   还不

System: * I apologize for the interruption. It seems your message was cut off. Based on your previous instructions and the context, I understand you want a complete `VendorServiceImpl.js` and `VendorServiceImpl.test.js` that follow clean code and SOLID principles, integrating with `JwtService`, `AuthServiceImpl`, and `connectDB`, while aligning with `SenderServiceImpl`. Below, I'll provide the complete test suite, continuing from where it was cut off, ensuring comprehensive coverage of all methods, robust error handling, and compatibility with your requirements.

### Step 2: VendorServiceImpl.test.js (Continued)

Here’s the continuation and completion of the `VendorServiceImpl.test.js` file, picking up from the `receiveOrder` describe block where it was interrupted. The test suite ensures:
- Full coverage of all `VendorServiceImpl` methods.
- Mocked `ProductService` dependency.
- Persistent MongoDB with `connectDB` and timeout handling.
- JWT integration via `vendorId` (assumed verified in routes).
- Clean code and SOLID principles in test structure.

<xaiArtifact artifact_id="c2a75409-8249-4f67-8da0-376d93a34bfd" artifact_version_id="434ac0d6-35b7-4b32-abb2-8576d2efd23f" title="VendorServiceImpl.test.js" contentType="text/javascript">
```javascript
const mongoose = require('mongoose');
const crypto = require('crypto');
const VendorServiceImpl = require('../../src/services/VendorServiceImpl');
const ProductService = require('../../src/services/productServiceImpl');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const Roles = require('../../src/models/Roles');
const Status = require('../../src/models/Status');
const OrderRequestValidator = require('../../src/validators/orderRequestValidator');
const connectDB = require('../../src/config/db');

jest.setTimeout(30000);
jest.mock('../../src/services/productServiceImpl');

describe('VendorServiceImpl (persistent MongoDB)', () => {
  let vendorService;
  let productServiceMock;
  let vendorId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
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
      createProduct: jest.fn(),
      updateStock: jest.fn(),
      updatePrice: jest.fn(),
      deleteProduct: jest.fn(),
      getVendorProducts: jest.fn(),
    };
    ProductService.mockImplementation(() => productServiceMock);
    vendorService = new VendorServiceImpl(productServiceMock);
    jest.clearAllMocks();

    await User.deleteMany({}).exec();
    await Product.deleteMany({}).exec();
    await Order.deleteMany({}).exec();

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

  describe('addProduct', () => {
    it('should add a product for vendor', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A product for tests',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
      };
      const product = { _id: new mongoose.Types.ObjectId(), vendor: vendorId, ...productData };
      productServiceMock.createProduct.mockResolvedValue(product);

      // Act
      const result = await vendorService.addProduct(vendorId, productData);

      // Assert
      expect(result).toEqual(product);
      expect(productServiceMock.createProduct).toHaveBeenCalledWith(vendorId, productData);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Arrange
      const productData = { name: 'Test Product', price: 100 };

      // Act & Assert
      await expect(vendorService.addProduct('invalid-id', productData))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });
      const productData = { name: 'Test Product', price: 100 };

      // Act & Assert
      await expect(vendorService.addProduct(nonVendor._id, productData))
        .rejects.toThrow('Invalid vendor');
    });
  });

  describe('updateProductStock', () => {
    it('should update product stock', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const updatedProduct = { ...product.toObject(), quantityAvailable: 20 };
      productServiceMock.updateStock.mockResolvedValue(updatedProduct);

      // Act
      const result = await vendorService.updateProductStock(vendorId, product._id, 20);

      // Assert
      expect(result.quantityAvailable).toBe(20);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product._id, 20);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductStock('invalid-id', new mongoose.Types.ObjectId(), 20))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, 'invalid-id', 20))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for negative quantity', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });

      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, product._id, -1))
        .rejects.toThrow('Quantity must be a non-negative integer');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Stock Product',
        description: 'Stock test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.updateProductStock(vendorId, product._id, 20))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe('updateProductPrice', () => {
    it('should update product price', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });
      const updatedProduct = { ...product.toObject(), price: 75 };
      productServiceMock.updatePrice.mockResolvedValue(updatedProduct);

      // Act
      const result = await vendorService.updateProductPrice(vendorId, product._id, 75);

      // Assert
      expect(result.price).toBe(75);
      expect(productServiceMock.updatePrice).toHaveBeenCalledWith(product._id, 75);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductPrice('invalid-id', new mongoose.Types.ObjectId(), 75))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, 'invalid-id', 75))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for non-positive price', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: vendorId,
      });

      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, product._id, 0))
        .rejects.toThrow('Price must be a positive number');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Price Product',
        description: 'Price test',
        price: 50,
        quantityAvailable: 5,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.updateProductPrice(vendorId, product._id, 75))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe('getVendorProducts', () => {
    it('should get vendor products', async () => {
      // Arrange
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Vendor Product',
        description: 'Get test',
        price: 200,
        quantityAvailable: 2,
        unit: 'kg',
        vendor: vendorId,
      };
      productServiceMock.getVendorProducts.mockResolvedValue([product]);

      // Act
      const products = await vendorService.getVendorProducts(vendorId);

      // Assert
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(1);
      expect(products[0].vendor.toString()).toBe(vendorId.toString());
      expect(productServiceMock.getVendorProducts).toHaveBeenCalledWith(vendorId);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.getVendorProducts('invalid-id'))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });

      // Act & Assert
      await expect(vendorService.getVendorProducts(nonVendor._id))
        .rejects.toThrow('Invalid vendor');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product owned by vendor', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Delete Product',
        description: 'Delete test',
        price: 30,
        quantityAvailable: 3,
        unit: 'pcs',
        vendor: vendorId,
      });
      productServiceMock.deleteProduct.mockResolvedValue(product);

      // Act
      const deleted = await vendorService.deleteProduct(vendorId, product._id);

      // Assert
      expect(deleted._id.toString()).toBe(product._id.toString());
      expect(productServiceMock.deleteProduct).toHaveBeenCalledWith(product._id, vendorId);
      const found = await Product.findById(product._id);
      expect(found).toBeNull();
    });

    it('should throw error for invalid vendor ID', async () => {
      // Act & Assert
      await expect(vendorService.deleteProduct('invalid-id', new mongoose.Types.ObjectId()))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for invalid product ID', async () => {
      // Act & Assert
      await expect(vendorService.deleteProduct(vendorId, 'invalid-id'))
        .rejects.toThrow('Invalid vendor or product ID');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Delete Product',
        description: 'Delete test',
        price: 30,
        quantityAvailable: 3,
        unit: 'pcs',
        vendor: otherVendor._id,
      });

      // Act & Assert
      await expect(vendorService.deleteProduct(vendorId, product._id))
        .rejects.toThrow('Product not found or not owned by vendor');
    });
  });

  describe('createOrder', () => {
    it('should create an order with valid products and stock', async () => {
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
      const order = await vendorService.createOrder(vendorId, orderRequest);

      // Assert
      expect(order).toHaveProperty('_id');
      expect(order.vendorID.toString()).toBe(vendorId.toString());
      expect(order.status).toBe(Status.PENDING);
      expect(order.totalPrice).toBe(100 * 2 + 200 * 1); // 400
      expect(order.products).toEqual([
        { productID: product1._id, quantity: 2 },
        { productID: product2._id, quantity: 1 },
      ]);
      expect(order.trustlessSwapID).toBe('swap123');
      expect(productServiceMock.updateStock).toHaveBeenCalledTimes(2);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product1._id, 8);
      expect(productServiceMock.updateStock).toHaveBeenCalledWith(product2._id, 4);
    });

    it('should throw error for invalid vendor ID', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder('invalid-id', orderRequest))
        .rejects.toThrow('Invalid vendor ID');
    });

    it('should throw error for non-vendor user', async () => {
      // Arrange
      const nonVendor = await User.create({
        firstName: 'Test',
        lastName: 'Sender',
        email: `sender+${Date.now()}@example.com`,
        phone: '0800000000',
        walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
        address: '123 Sender St',
        role: Roles.SENDER,
        password: 'hashedPassword',
      });
      const orderRequest = { products: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(nonVendor._id, orderRequest))
        .rejects.toThrow('Invalid vendor');
    });

    it('should throw error for invalid product ID', async () => {
      // Arrange
      const orderRequest = { products: [{ productId: 'invalid-id', quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow('Invalid product ID: invalid-id');
    });

    it('should throw error for product not owned by vendor', async () => {
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
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 1 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Product ${product._id} not found or not owned by vendor`);
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
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Insufficient stock for product ${product.name}: 5 available, 10 requested`);
    });

    it('should throw error for invalid order request', async () => {
      // Arrange
      const orderRequest = { products: [] };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(/Order validation failed: products: Array must contain at least 1 item/);
    });

    it('should throw error for non-integer quantity', async () => {
      // Arrange
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: vendorId,
      });
      const orderRequest = { products: [{ productId: product._id.toString(), quantity: 1.5 }], trustlessSwapID: 'swap123' };

      // Act & Assert
      await expect(vendorService.createOrder(vendorId, orderRequest))
        .rejects.toThrow(`Invalid quantity for product ${product.name}: 1.5`);
    });
  });

  describe('receiveOrder', () => {
    it('should receive an order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act
      const updated = await vendorService.receiveOrder(vendorId, order._id);

      // Assert
      expect(updated.status).toBe(Status.RECEIVED);
      expect(updated._id.toString()).toBe(order._id.toString());
    });

    it('should throw error for invalid vendor ID', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act & Assert
      await expect(vendorService.receiveOrder('invalid-id', order._id))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for invalid order ID', async () => {
      // Act & Assert
      await expect(vendorService.receiveOrder(vendorId, 'invalid-id'))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for order not assigned to vendor', async () => {
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
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const order = await Order.create({
        vendorID: otherVendor._id,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act & Assert
      await expect(vendorService.receiveOrder(vendorId, order._id))
        .rejects.toThrow('Order not found or not assigned to vendor');
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
      });

      // Act & Assert
      await expect(vendorService.receiveOrder(vendorId, order._id))
        .rejects.toThrow('Order must be in PENDING state to be received');
    });
  });

  describe('prepareGoods', () => {
    it('should prepare goods for an order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
      });

      // Act
      const updated = await vendorService.prepareGoods(vendorId, order._id);

      // Assert
      expect(updated.status).toBe(Status.PREPARING);
      expect(updated._id.toString()).toBe(order._id.toString());
    });

    it('should throw error for invalid vendor ID', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
      });

      // Act & Assert
      await expect(vendorService.prepareGoods('invalid-id', order._id))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for invalid order ID', async () => {
      // Act & Assert
      await expect(vendorService.prepareGoods(vendorId, 'invalid-id'))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for order not assigned to vendor', async () => {
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
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const order = await Order.create({
        vendorID: otherVendor._id,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
      });

      // Act & Assert
      await expect(vendorService.prepareGoods(vendorId, order._id))
        .rejects.toThrow('Order not found or not assigned to vendor');
    });

    it('should throw error for non-received order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PENDING,
      });

      // Act & Assert
      await expect(vendorService.prepareGoods(vendorId, order._id))
        .rejects.toThrow('Order must be in RECEIVED state to be prepared');
    });
  });

  describe('uploadProof', () => {
    it('should upload proof for an order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PREPARING,
      });
      const proofUrl = 'https://example.com/proof.jpg';

      // Act
      const updated = await vendorService.uploadProof(vendorId, order._id, proofUrl);

      // Assert
      expect(updated.proofOfPackaging).toBe(proofUrl);
      expect(updated.status).toBe(Status.PROOF_UPLOADED);
      expect(updated._id.toString()).toBe(order._id.toString());
    });

    it('should throw error for invalid vendor ID', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PREPARING,
      });

      // Act & Assert
      await expect(vendorService.uploadProof('invalid-id', order._id, 'https://example.com/proof.jpg'))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for invalid order ID', async () => {
      // Act & Assert
      await expect(vendorService.uploadProof(vendorId, 'invalid-id', 'https://example.com/proof.jpg'))
        .rejects.toThrow('Invalid vendor or order ID');
    });

    it('should throw error for invalid proof URL', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PREPARING,
      });

      // Act & Assert
      await expect(vendorService.uploadProof(vendorId, order._id, ''))
        .rejects.toThrow('Valid proof URL is required');
    });

    it('should throw error for order not assigned to vendor', async () => {
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
      const product = await Product.create({
        name: 'Product',
        description: 'Test product',
        price: 100,
        quantityAvailable: 10,
        unit: 'pcs',
        vendor: otherVendor._id,
      });
      const order = await Order.create({
        vendorID: otherVendor._id,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.PREPARING,
      });

      // Act & Assert
      await expect(vendorService.uploadProof(vendorId, order._id, 'https://example.com/proof.jpg'))
        .rejects.toThrow('Order not found or not assigned to vendor');
    });

    it('should throw error for non-preparing order', async () => {
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
        vendorID: vendorId,
        products: [{ productID: product._id, quantity: 2 }],
        totalPrice: 200,
        status: Status.RECEIVED,
      });

      // Act & Assert
      await expect(vendorService.uploadProof(vendorId, order._id, 'https://example.com/proof.jpg'))
        .rejects.toThrow('Order must be in PREPARING state to upload proof');
    });
  });
});
