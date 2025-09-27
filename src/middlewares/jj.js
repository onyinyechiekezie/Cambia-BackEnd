const mongoose = require('mongoose');
const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const AuthResponse = require('../../src/dtos/response/AuthResponse');
const connectDB = require('../../src/config/db');

// Increase Jest timeout to handle DB connection
jest.setTimeout(30000);

describe('AuthServiceImpl (persistent MongoDB)', () => {
  let authService;
  let jwtServiceMock;
  let passwordServiceMock;

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
    // Mock JwtService
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verify: jest.fn().mockReturnValue({ id: 'userId', email: 'test@example.com', role: 'sender' }),
    };

    // Mock PasswordService
    passwordServiceMock = {
      hash: jest.fn().mockResolvedValue('hashedPassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    authService = new AuthServiceImpl(jwtServiceMock, passwordServiceMock);

    // Clear DB collections before each test
    await User.deleteMany({});
    await Sender.deleteMany({});
    await Vendor.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Sender.deleteMany({});
    await Vendor.deleteMany({});
  });

  describe('register', () => {
    it('should register sender successfully', async () => {
      const result = await authService.register(senderData);

      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('User registered successfully');

      const savedSender = await Sender.findOne({ email: senderData.email });
      expect(savedSender).toBeTruthy();
      expect(savedSender.role).toBe('sender');
      expect(savedSender.firstName).toBe('Ibrahim');
      expect(passwordServiceMock.hash).toHaveBeenCalledWith('password');
    });

    it('should register vendor successfully', async () => {
      const result = await authService.register(vendorData);

      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.status).toBe(true);
      expect(result.message).toBe('User registered successfully');

      const savedVendor = await Vendor.findOne({ email: vendorData.email });
      expect(savedVendor).toBeTruthy();
      expect(savedVendor.role).toBe('vendor');
      expect(savedVendor.firstName).toBe('Adedeji');
      expect(passwordServiceMock.hash).toHaveBeenCalledWith('password');
    });

    it('should throw error for duplicate email', async () => {
      await Sender.create({ ...senderData, password: 'hashedPassword' });

      await expect(authService.register(senderData)).rejects.toThrow('Email already exists');
    });

    it('should throw error for invalid role', async () => {
      const invalidData = { ...senderData, role: 'Invalid' };

      await expect(authService.register(invalidData)).rejects.toThrow('Invalid role');
    });

    it('should throw error for password hashing failure', async () => {
      passwordServiceMock.hash.mockRejectedValueOnce(new Error('Hashing failed'));

      await expect(authService.register(senderData)).rejects.toThrow('Hashing failed');
    });

    it('should throw error for invalid input data', async () => {
      const invalidData = { ...senderData, email: '' };

      await expect(authService.register(invalidData)).rejects.toThrow(/email/i);
    });
  });

  describe('login', () => {
    it('should login sender successfully and return token', async () => {
      await User.create({ ...senderData, password: 'hashedPassword' });

      const result = await authService.login({
        email: senderData.email,
        password: senderData.password,
      });

      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Login successful');
      expect(passwordServiceMock.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(jwtServiceMock.sign).toHaveBeenCalled();
    });

    it('should login vendor successfully and return token', async () => {
      await User.create({ ...vendorData, password: 'hashedPassword' });

      const result = await authService.login({
        email: vendorData.email,
        password: vendorData.password,
      });

      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result.user).toBeInstanceOf(AuthResponse);
      expect(result.user.status).toBe(true);
      expect(result.user.message).toBe('Login successful');
      expect(passwordServiceMock.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(jwtServiceMock.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      await expect(authService.login({ email: 'nonexistent@gmail.com', password: 'password' })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      await User.create({ ...senderData, password: 'hashedPassword' });
      passwordServiceMock.compare.mockResolvedValueOnce(false);

      await expect(authService.login({ email: senderData.email, password: 'wrongpassword' })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for missing email or password', async () => {
      await expect(authService.login({ email: '', password: '' })).rejects.toThrow(/credentials/i);
    });

    it('should throw error for JWT signing failure', async () => {
      await User.create({ ...senderData, password: 'hashedPassword' });
      jwtServiceMock.sign.mockImplementationOnce(() => { throw new Error('JWT signing failed'); });

      await expect(authService.login({ email: senderData.email, password: senderData.password })).rejects.toThrow('JWT signing failed');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', async () => {
      const token = 'valid-token';
      const decoded = { id: 'userId', email: 'test@example.com', role: 'sender' };
      jwtServiceMock.verify.mockReturnValue(decoded);

      const result = authService.verifyToken(token);

      expect(result).toEqual(decoded);
      expect(jwtServiceMock.verify).toHaveBeenCalledWith(token);
    });

    it('should throw error for invalid or expired token', async () => {
      jwtServiceMock.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(() => authService.verifyToken('invalid-token')).toThrow('Invalid or expired');
    });
  });
});
