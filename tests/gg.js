const AuthServiceImpl = require('../services/authServiceImpl');
const User = require('../models/User');
const Sender = require('../models/Sender');
const Vendor = require('../models/Vendor');
const AuthResponse = require('../dtos/response/AuthResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { mongodbTestUri } = require('../config/env');

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('Authentication service tests', () => {
  let authService;
  const senderData = {
    email: '1234@gmail.com',
    firstName: 'Ibrahim',
    lastName: 'Doe',
    password: 'password123',
    walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    role: 'sender',
    phone: '07015366234',
    address: '123 Main St, Lagos',
  };

  const vendorData = {
    email: 'bramtech@gmail.com',
    firstName: 'Adedeji',
    lastName: 'Doe',
    password: 'password123',
    walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    role: 'vendor',
    phone: '08015366234',
    address: '123 Main St, Lagos',
  };

  const loginData = {
    email: '1234@gmail.com',
    password: 'password123',
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await mongoose.connect(mongodbTestUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to persistent test DB (diaspora-test) for manual inspection.');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    authService = new AuthServiceImpl();
    jest.clearAllMocks();

    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    uuidv4.mockReturnValue('generated-uuid');
    jwt.sign.mockReturnValue('mockToken');
    jwt.verify.mockReturnValue({ id: 'generated-uuid', email: senderData.email, role: 'sender' });

    await User.deleteMany({}).exec();
    await Sender.deleteMany({}).exec();
    await Vendor.deleteMany({}).exec();
  });

  describe('register user', () => {
    test('should register sender and return AuthResponse with user data', async () => {
      const result = await authService.register(senderData);

      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('Operation successful');
      expect(result.user).toEqual({
        id: 'generated-uuid',
        email: senderData.email,
        walletAddress: senderData.walletAddress,
        role: 'sender',
        firstName: senderData.firstName,
        lastName: senderData.lastName,
        phone: senderData.phone,
        address: senderData.address,
      });

      const savedUser = await User.findOne({ email: senderData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.id).toBe('generated-uuid');
      expect(savedUser.role).toBe('sender');

      const savedSender = await Sender.findOne({ email: senderData.email });
      expect(savedSender).toBeTruthy();
      expect(savedSender.id).toBe('generated-uuid');
      expect(bcrypt.hash).toHaveBeenCalledWith(senderData.password, 10);
      expect(uuidv4).toHaveBeenCalled();
    });

    test('should register vendor and return AuthResponse with user data', async () => {
      const result = await authService.register(vendorData);

      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('Operation successful');
      expect(result.user).toEqual({
        id: 'generated-uuid',
        email: vendorData.email,
        walletAddress: vendorData.walletAddress,
        role: 'vendor',
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        phone: vendorData.phone,
        address: vendorData.address,
      });

      const savedUser = await User.findOne({ email: vendorData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.id).toBe('generated-uuid');
      expect(savedUser.role).toBe('vendor');

      const savedVendor = await Vendor.findOne({ email: vendorData.email });
      expect(savedVendor).toBeTruthy();
      expect(savedVendor.id).toBe('generated-uuid');
      expect(bcrypt.hash).toHaveBeenCalledWith(vendorData.password, 10);
      expect(uuidv4).toHaveBeenCalled();
    });

    test('should throw error for invalid role', async () => {
      const invalidData = { ...senderData, role: 'invalid' };
      await expect(authService.register(invalidData)).rejects.toThrow('Invalid role');
    });

    test('should throw error for duplicate email', async () => {
      await Sender.create({
        id: uuidv4(),
        email: senderData.email,
        password: 'hashedPassword',
        walletAddress: senderData.walletAddress,
        role: senderData.role,
        firstName: senderData.firstName,
        lastName: senderData.lastName,
        phone: senderData.phone,
        address: senderData.address,
      });

      await expect(authService.register(senderData)).rejects.toThrow('Email already exists');
    });

    test('should throw error for invalid input data', async () => {
      const invalidData = { ...senderData, email: 'invalid', password: 'short' };
      await expect(authService.register(invalidData)).rejects.toThrow(/email must be a valid email/);
    });
  });

  describe('login user', () => {
    test('should login sender and return token with AuthResponse', async () => {
      await Sender.create({
        id: 'user1',
        email: loginData.email,
        password: 'hashedPassword',
        walletAddress: senderData.walletAddress,
        role: 'sender',
        firstName: senderData.firstName,
        lastName: senderData.lastName,
        phone: senderData.phone,
        address: senderData.address,
      });

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('token', 'mockToken');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Operation successful');
      expect(result.user.user).toEqual(
        expect.objectContaining({
          id: 'user1',
          email: loginData.email,
          role: 'sender',
          walletAddress: senderData.walletAddress,
        })
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user1', email: loginData.email, role: 'sender' }),
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    test('should login vendor and return token with AuthResponse', async () => {
      await Vendor.create({
        id: 'user2',
        email: vendorData.email,
        password: 'hashedPassword',
        walletAddress: vendorData.walletAddress,
        role: 'vendor',
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        phone: vendorData.phone,
        address: vendorData.address,
      });

      const result = await authService.login({ email: vendorData.email, password: vendorData.password });

      expect(result).toHaveProperty('token', 'mockToken');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Operation successful');
      expect(result.user.user).toEqual(
        expect.objectContaining({
          id: 'user2',
          email: vendorData.email,
          role: 'vendor',
          walletAddress: vendorData.walletAddress,
        })
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(vendorData.password, 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user2', email: vendorData.email, role: 'vendor' }),
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    test('should throw error for invalid email', async () => {
      await expect(authService.login(loginData)).rejects.toThrow('Invalid email');
    });

    test('should throw error for invalid password', async () => {
      await Sender.create({
        id: 'user1',
        email: loginData.email,
        password: 'hashedPassword',
        walletAddress: senderData.walletAddress,
        role: 'sender',
        firstName: senderData.firstName,
        lastName: senderData.lastName,
        phone: senderData.phone,
        address: senderData.address,
      });

      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid password');
    });

    test('should throw error for invalid input data', async () => {
      const invalidData = { email: 'invalid', password: 'short' };
      await expect(authService.login(invalidData)).rejects.toThrow(/email must be a valid email/);
    });
  });

  describe('verify token', () => {
    test('should verify valid token and return decoded payload', async () => {
      const token = 'validToken';
      const decoded = { id: 'user1', email: '1234@gmail.com', role: 'sender' };
      jwt.verify.mockReturnValue(decoded);

      const result = authService.verifyToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    test('should throw error for invalid or expired token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalidToken')).rejects.toThrow('Invalid or