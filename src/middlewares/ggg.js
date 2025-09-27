const mongoose = require('mongoose');
const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const AuthResponse = require('../../src/dtos/response/AuthResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('../../src/config/db');

// Mock dependencies
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthServiceImpl', () => {
  let authService;

  const senderData = {
    email: '1234@gmail.com',
    firstName: 'Ibrahim',
    lastName: 'Doe',
    password: 'password',
    walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    role: 'sender',
    phone: '07015366234',
    address: '123 Main St, Lagos',
  };

  const vendorData = {
    email: 'bramtech@gmail.com',
    firstName: 'Adedeji',
    lastName: 'Doe',
    password: 'password',
    walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    role: 'vendor',
    phone: '08015366234',
    address: '123 Main St, Lagos',
  };

  const loginData = {
    email: 'bramtech@gmail.com',
    password: 'password',
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    await connectDB();
    console.log('Connected to persistent test DB for manual inspection.');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    authService = new AuthServiceImpl();
    jest.clearAllMocks();

    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocked-jwt-token');

    await User.deleteMany({}).exec();
    await Sender.deleteMany({}).exec();
    await Vendor.deleteMany({}).exec();
  });

  afterEach(async () => {
    await User.deleteMany({}).exec();
    await Sender.deleteMany({}).exec();
    await Vendor.deleteMany({}).exec();
  });

  describe('register', () => {
    it('should register sender successfully', async () => {
      // Arrange
      const data = { ...senderData };

      // Act
      const result = await authService.register(data);

      // Assert
      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('User registered successfully');

      const savedSender = await Sender.findOne({ email: senderData.email });
      expect(savedSender).toBeTruthy();
      expect(savedSender.role).toBe('sender');
      expect(savedSender.firstName).toBe('Ibrahim');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);

      const savedUser = await User.findOne({ email: senderData.email });
      expect(savedUser).toBeFalsy(); // User model not used for sender
    });

    it('should register vendor successfully', async () => {
      // Arrange
      const data = { ...vendorData };

      // Act
      const result = await authService.register(data);

      // Assert
      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('User registered successfully');

      const savedVendor = await Vendor.findOne({ email: vendorData.email });
      expect(savedVendor).toBeTruthy();
      expect(savedVendor.role).toBe('vendor');
      expect(savedVendor.firstName).toBe('Adedeji');

      const savedUser = await User.findOne({ email: vendorData.email });
      expect(savedUser).toBeFalsy(); // User model not used for vendor
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      await Sender.create({
        ...senderData,
        password: 'hashedPassword',
      });

      // Act & Assert
      await expect(authService.register(senderData)).rejects.toThrow('Email already exists');
    });

    it('should throw error for invalid role', async () => {
      // Arrange
      const invalidData = { ...senderData, role: 'invalid' };

      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow('Invalid role');
    });

    it('should throw error for bcrypt failure', async () => {
      // Arrange
      bcrypt.hash.mockRejectedValueOnce(new Error('Hashing failed'));

      // Act & Assert
      await expect(authService.register(senderData)).rejects.toThrow('Hashing failed');
    });

    it('should throw error for invalid input data', async () => {
      // Arrange
      const invalidData = { ...senderData, email: '' };

      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow(/Validation failed/);
    });
  });

  describe('login', () => {
    it('should login sender successfully and return token', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword';
      await User.create({ ...senderData, password: hashedPassword }); // Login uses User model

      // Act
      const result = await authService.login({
        email: senderData.email,
        password: senderData.password,
      });

      // Assert
      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Login successful');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', hashedPassword);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String), role: 'sender', email: senderData.email }),
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should login vendor successfully and return token', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword';
      await User.create({ ...vendorData, password: hashedPassword }); // Login uses User model

      // Act
      const result = await authService.login({
        email: vendorData.email,
        password: vendorData.password,
      });

      // Assert
      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Login successful');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', hashedPassword);
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      // Act & Assert
      await expect(
        authService.login({ email: 'lolad3@gmail.com', password: 'password' })
      ).rejects.toThrow('Invalid email');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      await User.create({ ...senderData, password: 'hashedPassword' });
      bcrypt.compare.mockResolvedValueOnce(false);

      // Act & Assert
      await expect(
        authService.login({ email: senderData.email, password: 'wrongpassword' })
      ).rejects.toThrow('Invalid password');
    });

    it('should throw error for missing email or password', async () => {
      // Act & Assert
      await expect(authService.login({ email: '', password: '' })).rejects.toThrow(/Validation failed/);
    });

    it('should throw error for JWT signing failure', async () => {
      // Arrange
      await User.create({ ...senderData, password: 'hashedPassword' });
      jwt.sign.mockImplementationOnce(() => {
        throw new Error('JWT signing failed');
      });

      // Act & Assert
      await expect(
        authService.login({ email: senderData.email, password: senderData.password })
      ).rejects.toThrow('JWT signing failed');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const decoded = { id: 'userId', email: 'test@example.com', role: 'sender' };
      jwt.verify.mockReturnValue(decoded);

      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should throw error for invalid or expired token', async () => {
      // Arrange
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid or expired');
    });
  });
});
