const AuthServiceImpl = require('../services/authServiceImpl');
const RegisterRequestDTO = require('../dto/req/register.dto');
const LoginRequestDTO = require('../dto/req/login.dto');
const AuthResponseDTO = require('../dto/res/auth.dto');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('@mysten/sui.js', () => ({
  SuiClient: jest.fn().mockImplementation(() => ({})),
  getFullnodeUrl: jest.fn().mockReturnValue('https://testnet.sui.io'),
  TransactionBlock: jest.fn(),
}));

describe('AuthServiceImpl', () => {
  let authService;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    authService = new AuthServiceImpl();
    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');
    uuidv4.mockReturnValue('generated-uuid');
    await User.deleteMany({});
  });

  describe('register', () => {
    const validData = {
      email: 'ibrahim@example.com',
      firstName: 'Ibrahim',
      lastName: 'Doe',
      password: 'password123456',
      walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      role: 'sender',
      phone: '1234567890',
      address: '123 Main St, Lagos',
    };

    test('should register user and return AuthResponseDTO', async () => {
      const result = await authService.register(validData);

      expect(result).toBeInstanceOf(AuthResponseDTO);
      expect(result.id).toBe('generated-uuid');
      expect(result.email).toBe(validData.email);
      expect(result.role).toBe(validData.role);
      expect(bcrypt.hash).toHaveBeenCalledWith(validData.password, 10);
      expect(uuidv4).toHaveBeenCalled();

      const savedUser = await User.findOne({ email: validData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.id).toBe('generated-uuid');
    });

    test('should throw error for invalid registration data', async () => {
      const invalidData = { email: 'invalid', password: 'short' };
      await expect(authService.register(invalidData)).rejects.toThrow();
    });

    test('should throw error for duplicate email', async () => {
      await User.create({
        id: uuidv4(),
        email: validData.email,
        password: 'hashedPassword',
        walletAddress: validData.walletAddress,
        role: validData.role,
      });

      await expect(authService.register(validData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'ibrahim@example.com',
      password: 'password123456',
    };

    test('should login user and return token with AuthResponseDTO', async () => {
      await User.create({
        id: 'user1',
        email: validLoginData.email,
        password: 'hashedPassword',
        walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        role: 'sender',
      });

      const result = await authService.login(validLoginData);

      expect(result).toHaveProperty('token', 'mockToken');
      expect(result.user).toBeInstanceOf(AuthResponseDTO);
      expect(result.user.email).toBe(validLoginData.email);
      expect(User.findOne).toHaveBeenCalledWith({ email: validLoginData.email });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
    });

    test('should throw error for invalid login data', async () => {
      const invalidData = { email: 'invalid', password: 'short' };
      await expect(authService.login(invalidData)).rejects.toThrow();
    });

    test('should throw error for unknown email', async () => {
      await expect(authService.login(validLoginData)).rejects.toThrow('Invalid email or password');
    });

    test('should throw error for invalid password', async () => {
      await User.create({
        id: 'user1',
        email: validLoginData.email,
        password: 'hashedPassword',
        walletAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        role: 'sender',
      });

      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(validLoginData)).rejects.toThrow('Invalid email or password');
    });
  });
});