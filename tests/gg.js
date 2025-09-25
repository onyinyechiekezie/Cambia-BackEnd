const AuthService = require('./authService');
const User = require('../models/User');
const Sender = require('../models/Sender');
const Vendor = require('../models/Vendor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { jwtSecret } = require('../config/env');
const RegisterValidator = require('../validators/registerValidator');
const LoginValidator = require('../validators/loginValidator');
const AuthResponseDTO = require('../dto/res/auth.dto');

class AuthServiceImpl extends AuthService {
  constructor() {
    super();
  }

  async register(authData) {
    const validated = RegisterValidator.validate(authData);

    const existing = await User.findOne({ email: validated.email });
    if (existing) throw new Error('Email already exists');

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const userData = { id, ...validated, password: hashedPassword };

    const user = await User.create(userData);

    if (user.role === 'sender') await Sender.create(userData);
    else if (user.role === 'vendor') await Vendor.create(userData);

    return AuthResponseDTO.fromUserData(user);
  }

  async login(authData) {
    const validated = LoginValidator.validate(authData);

    const user = await User.findOne({ email: validated.email });
    if (!user) throw new Error('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, walletAddress: user.walletAddress },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return { token, user: AuthResponseDTO.fromUserData(user) };
  }
}

module.exports = AuthServiceImpl;
