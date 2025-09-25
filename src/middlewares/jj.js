const mongoose = require('mongoose');
const AuthServiceImpl = require('../../src/services/authServiceImpl');
const AuthResponse = require('../../src/dtos/response/AuthResponse');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('../../src/config/db');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('uuid');

describe('AuthServiceImpl', () => {
  let authService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB(); // Connect to your test DB
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    authService = new AuthServiceImpl();
    jest.clearAllMocks();

    // Mock bcrypt, JWT, UUID
    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');
    uuidv4.mockReturnValue('generated-uuid');

    // Clear collections before each test
    await User.deleteMany({});
    await Sender.deleteMany({});
    await Vendor.deleteMany({});
  });

  // ---------------- Register tests ----------------
  test('registers a sender successfully', async () => {
    const senderData = {
      email: 'sender@example.com',
      firstName: 'Sender',
      lastName: 'One',
      password: 'password123',
      walletAddress: '0x123456',
      role: 'sender',
      phone: '1234567890',
      address: 'Street 1',
    };

    const result = await authService.register(senderData);

    expect(result).toBeInstanceOf(AuthResponse);
    expect(result.status).toBe(true);
    expect(result.message).toBe('User registered successfully');

    const user = await User.findOne({ email: senderData.email });
    expect(user).toBeTruthy();
    expect(user.id).toBe('generated-uuid');

    const sender = await Sender.findOne({ email: senderData.email });
    expect(sender).toBeTruthy();
  });

  test('registers a vendor successfully', async () => {
    const vendorData = {
      email: 'vendor@example.com',
      firstName: 'Vendor',
      lastName: 'Two',
      password: 'password123',
      walletAddress: '0xabcdef',
      role: 'vendor',
    };

    const result = await authService.register(vendorData);

    expect(result).toBeInstanceOf(AuthResponse);
    expect(result.status).toBe(true);

    const user = await User.findOne({ email: vendorData.email });
    expect(user).toBeTruthy();

    const vendor = await Vendor.findOne({ email: vendorData.email });
    expect(vendor).toBeTruthy();
  });

  test('throws error if email already exists', async () => {
    await User.create({ email: 'exists@example.com', password: '123', role: 'sender', id: '1', walletAddress: '0x1' });

    const duplicateData = { email: 'exists@example.com', password: 'password', role: 'sender', walletAddress: '0x2' };
    await expect(authService.register(duplicateData)).rejects.toThrow('Email already exists');
  });

  // ---------------- Login tests ----------------
  test('login succeeds with valid credentials', async () => {
    const userData = {
      email: 'login@example.com',
      firstName: 'Login',
      lastName: 'User',
      password: 'hashedPassword',
      walletAddress: '0xlogin',
      role: 'sender',
      id: 'generated-uuid',
    };
    await User.create(userData);

    const result = await authService.login({ email: userData.email, password: 'password123' });

    expect(result).toHaveProperty('token', 'mockToken');
    expect(result.user).toBeInstanceOf(AuthResponse);
    expect(result.user.status).toBe(true);
  });

  test('login fails with wrong email', async () => {
    await expect(authService.login({ email: 'notfound@example.com', password: '123' }))
      .rejects
      .toThrow('Invalid email or password');
  });

  test('login fails with wrong password', async () => {
    const userData = { email: 'user@example.com', password: 'hashedPassword', role: 'sender', walletAddress: '0x1', id: 'id1' };
    await User.create(userData);

    bcrypt.compare.mockResolvedValue(false);

    await expect(authService.login({ email: userData.email, password: 'wrongpass' }))
      .rejects
      .toThrow('Invalid email or password');
  });
});
