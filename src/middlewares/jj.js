const mongoose = require('mongoose');
const AuthServiceImpl = require('../../src/services/AuthServiceImpl');
const AuthResponse = require('../../src/dtos/response/AuthResponse');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('../../src/config/db');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('uuid');

describe('AuthServiceImpl JWT Tests', () => {
  let authService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    authService = new AuthServiceImpl();
    jest.clearAllMocks();

    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');
    uuidv4.mockReturnValue('generated-uuid');

    await User.deleteMany({});
  });

  test('login generates JWT token', async () => {
    const userData = { email: 'user@test.com', password: 'hashedPassword', role: 'sender', id: 'generated-uuid' };
    await User.create(userData);

    const result = await authService.login({ email: 'user@test.com', password: 'password123' });

    expect(result).toHaveProperty('token', 'mockToken');
    expect(result.user).toBeInstanceOf(AuthResponse);
    expect(result.user.status).toBe(true);

    // Verify token using verifyToken method
    jwt.verify.mockReturnValue({ id: 'generated-uuid', email: 'user@test.com', role: 'sender' });
    const payload = authService.verifyToken('mockToken');
    expect(payload).toEqual({ id: 'generated-uuid', email: 'user@test.com', role: 'sender' });
  });

  test('verifyToken throws error for invalid token', () => {
    jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

    expect(() => authService.verifyToken('badToken')).toThrow('Invalid or expired token');
  });
});
