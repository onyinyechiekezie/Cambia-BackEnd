const mongoose = require('mongoose');
const crypto = require('crypto');

const Vendor = require('../../src/models/Vendor');
<<<<<<< HEAD
=======
const Sender = require('../../src/models/Sender');
>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const vendorService = require('../../src/services/vendorServiceImpl');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cambia_test';

beforeAll(async () => {
  // connect to real MongoDB (Compass will show changes in the `cambia_test` DB)
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // we disconnect after tests finish
  await mongoose.disconnect();
});

afterEach(async () => {
  // clean up so each test starts fresh
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Vendor.deleteMany({});
});

describe('VendorServiceImpl (real MongoDB)', () => {
<<<<<<< HEAD
  let vendor;

  beforeEach(async () => {
    // create a fresh vendor before each test with a unique walletAddress/email
    vendor = await Vendor.create({
      firstName: 'Test',
      lastName: 'Vendor',
      email: `vendor+${Date.now()}@example.com`,
      phone: '0800000000',
      walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
      address: '123 Test St',
    });
  });

=======
  let vendor, sender, product;

beforeEach(async () => {
  // create vendor
  vendor = await Vendor.create({
    firstName: 'Test',
    lastName: 'Vendor',
    email: `vendor+${Date.now()}@example.com`,
    phone: '0800000000',
    walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
    address: '123 Test St',
    // role: 'vendor',
  });

  // create sender
  sender = await Sender.create({
    firstName: 'Test',
    lastName: 'Sender',
    email: `sender+${Date.now()}@example.com`,
    phone: '0811111111',
    walletAddress: '0x' + crypto.randomBytes(32).toString('hex'),
    address: '456 Sender St',
    // role: 'sender',
  });

  // create product
//   product = await Product.create({
//     name: 'Order Product',
//     description: 'for order tests',
//     price: 100,
//     quantityAvailable: 5,
//     unit: 'pcs',
//     vendor: vendor._id,
//   });
});


>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
  test('should add a product for vendor', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A product for tests',
      price: 100,
      quantityAvailable: 10,
      unit: 'pcs',
    };

    const product = await vendorService.addProduct(vendor._id, productData);

    expect(product).toHaveProperty('_id');
    expect(product.vendor.toString()).toBe(vendor._id.toString());
    expect(product.name).toBe(productData.name);
  });

   test('should update product stock', async () => {
    const product = await Product.create({
      name: 'Stock Product',
      description: 'stock test',
      price: 50,
      quantityAvailable: 5,
      unit: 'pcs',
      vendor: vendor._id,
    });

    const updated = await vendorService.updateProductStock(vendor._id, product._id, 20);
    expect(updated.quantityAvailable).toBe(20);
  });

  test('should update product price', async () => {
    const product = await Product.create({
      name: 'Price Product',
      description: 'price test',
      price: 50,
      quantityAvailable: 5,
      unit: 'pcs',
      vendor: vendor._id,
    });

    const updated = await vendorService.updateProductPrice(vendor._id, product._id, 75);
    expect(updated.price).toBe(75);
  });

  test('should get vendor products', async () => {
    await Product.create({
      name: 'Vendor Product',
      description: 'get test',
      price: 200,
      quantityAvailable: 2,
      unit: 'kg',
      vendor: vendor._id,
    });

    const products = await vendorService.getVendorProducts(vendor._id);
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(1);
    expect(products[0].vendor.toString()).toBe(vendor._id.toString());
  });

  test('should delete product owned by vendor', async () => {
    const product = await Product.create({
      name: 'Delete Product',
      description: 'delete test',
      price: 30,
      quantityAvailable: 3,
      unit: 'pcs',
      vendor: vendor._id,
    });

    const deleted = await vendorService.deleteProduct(vendor._id, product._id);
    expect(deleted._id.toString()).toBe(product._id.toString());

    const found = await Product.findById(product._id);
    expect(found).toBeNull();

    
  });

  test('should receive (acknowledge) an order', async () => {
<<<<<<< HEAD
    const order = await Order.create({
      vendor: vendor._id,
      totalAmount: 500,
      status: 'pending',
    });

    const updated = await vendorService.receiveOrder(vendor._id, order._id);
    expect(updated.status).toBe('RECEIVED');
  }); 

  test('should prepare goods for an order', async () => {
    const order = await Order.create({
      vendor: vendor._id,
      totalAmount: 400,
      status: 'pending',
    });

    const updated = await vendorService.prepareGoods(vendor._id, order._id);
    expect(updated.status).toBe('PREPARING');

  });

  test('should upload proof for an order', async () => {
    const order = await Order.create({
      vendor: vendor._id,
      totalAmount: 250,
      status: 'pending',
    });

    const proofUrl = 'https://example.com/proof.jpg';
    const updated = await vendorService.uploadProof(vendor._id, order._id, proofUrl);
    expect(updated.proofOfPackaging).toBe(proofUrl);
    expect(updated.status).toBe('PACKAGED');

  });

=======
  const product = await Product.create({
    name: 'Order Product',
    description: 'for order tests',
    price: 100,
    quantityAvailable: 5,
    unit: 'pcs',
    vendor: vendor._id,
  });

  const order = await Order.create({
    senderID: sender._id,
    vendorID: vendor._id,
    products: [product._id],
    quantity: 2,
    totalPrice: 200,
    status: 'pending',
  });

  const updated = await vendorService.receiveOrder(vendor._id, order._id);
  expect(updated.status).toBe('received'); // ✅ matches enum
});


test('should prepare goods for an order', async () => {
  const product = await Product.create({
    name: 'Prepare Product',
    description: 'prepare test',
    price: 100,
    quantityAvailable: 5,
    unit: 'pcs',
    vendor: vendor._id,
  });

  const order = await Order.create({
    senderID: sender._id,
    vendorID: vendor._id,
    products: [product._id],
    quantity: 1,
    totalPrice: 100,
    status: 'pending',
  });

  const updated = await vendorService.prepareGoods(vendor._id, order._id);
  expect(updated.status).toBe('prepared'); // ✅ matches enum
});


test('should upload proof for an order', async () => {
  const product = await Product.create({
    name: 'Proof Product',
    description: 'proof test',
    price: 100,
    quantityAvailable: 5,
    unit: 'pcs',
    vendor: vendor._id,
  });

  const order = await Order.create({
    senderID: sender._id,
    vendorID: vendor._id,
    products: [product._id],
    quantity: 1,
    totalPrice: 100,
    status: 'pending',
  });

  const proofUrl = 'https://example.com/proof.jpg';
  const updated = await vendorService.uploadProof(vendor._id, order._id, proofUrl);

  expect(updated.proofOfPackaging).toBe(proofUrl);
  expect(updated.status).toBe('proof_uploaded'); // ✅ matches enum
});


>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15






  });