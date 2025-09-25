const mongoose = require('mongoose');
const crypto = require('crypto');

const Vendor = require('../../src/models/Vendor');
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



  });