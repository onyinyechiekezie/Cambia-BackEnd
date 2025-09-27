const mongoose = require('mongoose');
const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const AuthResponse = require('../../src/dtos/response/AuthResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('../../src/config/db');

jest.setTimeout(30000);
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));
describe('AuthServiceImpl (persistent MongoDB)', () => {
  let authService;
  let jwtServiceMock;

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
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue("mocked-jwt-token"),
      verify: jest.fn().mockReturnValue({ id: "userId", email: 'test@example.com', role: "sender"}),
    };
    authService = new AuthServiceImpl(jwtServiceMock);    
    await User.deleteMany({});
    await Sender.deleteMany({});
    await Vendor.deleteMany({});
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
      const invalidData = { ...senderData, role: 'Invalid' };

      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow('Invalid role');
    });

    it('should throw error for invalid input data', async () => {
      // Arrange
      const invalidData = { ...senderData, email: '' };

      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow("Email is required");
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
      expect(jwtServiceMock.sign).toHaveBeenCalled();
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
      expect(jwtServiceMock.verify).toHaveBeenCalledWith(token);
    });

    it('should throw error for invalid email', async () => {
      // Act & Assert
      await expect(
        authService.login({ email: 'lolad3@gmail.com', password: 'password' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      await User.create({ ...senderData, password: 'hashedPassword' });
      bcrypt.compare.mockResolvedValueOnce(false);

      // Act & Assert
      await expect(
        authService.login({ email: senderData.email, password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for missing email or password', async () => {
      // Act & Assert
      await expect(authService.login({ email: '', password: '' })).rejects.toThrow("credentials is required");
    });

    it('should throw error for JWT signing failure', async () => {
      // Arrange
      await User.create({ ...senderData, password: 'hashedPassword' });
      jwtServiceMock.sign.mockImplementationOnce(() => {
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
      const result = await authService.verifyToken(token);

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
