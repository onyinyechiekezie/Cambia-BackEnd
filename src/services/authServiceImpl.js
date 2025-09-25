const AuthService = require('./authService');

class AuthServiceImpl extends AuthService {
    constructor
}

const AuthService = require('./authService');
const RegisterRequestDTO = require('../dto/req/register.dto');
const LoginRequestDTO = require('../dto/req/login.dto');
const AuthResponseDTO = require('../dto/res/auth.dto');
const User = require('../models/user');
const { SuiClient, getFullnodeUrl, TransactionBlock } = require('@mysten/sui.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { suiNetwork, suiContractAddress, jwtSecret } = require('../config/env');

/**
 * Implementation of AuthService for user registration and login.
 */
class AuthServiceImpl extends AuthService {
  constructor() {
    super();
    this.client = new SuiClient({ url: getFullnodeUrl(suiNetwork) });
  }

  async register(authData) {
    const validatedData = RegisterRequestDTO.validate(authData);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const userData = {
      id,
      email: validatedData.email,
      password: hashedPassword,
      walletAddress: validatedData.walletAddress,
      role: validatedData.role,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      address: validatedData.address,
    };

    try {
      const user = new User(userData);
      await user.save();

      console.log('Registering user on Sui blockchain:', userData);
      // Placeholder for Sui blockchain integration
      // const tx = new TransactionBlock();
      // tx.moveCall({
      //   target: `${suiContractAddress}::DiasporaRemittance::store_user`,
      //   arguments: [
      //     tx.pure(id),
      //     tx.pure(userData.email),
      //     tx.pure(userData.walletAddress),
      //     tx.pure(userData.role),
      //   ],
      // });
      // await this.client.signAndExecuteTransactionBlock({ transactionBlock: tx });

      return AuthResponseDTO.fromUserData(userData);
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(authData) {
    const validatedData = LoginRequestDTO.validate(authData);

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, walletAddress: user.walletAddress, role: user.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: AuthResponseDTO.fromUserData(user),
    };
  }
}

module.exports = AuthServiceImpl;
  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT, {
      expiresIn: '1d',
    });

    return { token, user: new AuthResponseDTO(user) };
  }
}

module.exports = AuthServiceImpl;
