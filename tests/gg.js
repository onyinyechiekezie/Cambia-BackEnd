// const AuthService = require('./authService');
// const RegisterRequest = require('../dtos/request/userRegisterReq');
// const AuthResponse = require('../dtos/response/AuthResponse');
// const User = require('../models/User');
// const Sender = require('../models/Sender');
// const Vendor = require('../models/Vendor');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const { jwtSecret } = require('../config/env'); // fixed typo
// const RegisterValidator = require('../validators/registerValidator');
// const LoginValidator = require('../validators/loginValidator');

// class AuthServiceImpl extends AuthService {
//   constructor() {
//     super();
//   }

//   // ---------------- Register ----------------
//   async register(registerRequest) {
//     // 1️⃣ Validate input
//     const validated = RegisterValidator.validate(registerRequest);

//     // 2️⃣ Check if user already exists
//     const existingUser = await User.findOne({ email: validated.email });
//     if (existingUser) throw new Error('Email already exists');

//     // 3️⃣ Generate ID and hash password
//     const id = uuidv4();
//     const hashedPassword = await bcrypt.hash(validated.password, 10); // fixed typo
//     const userData = { id, ...validated, password: hashedPassword };

//     // 4️⃣ Save user in main User collection
//     const user = await User.create(userData);

//     // 5️⃣ Save user in role-specific collection
//     if (user.role === 'sender') {
//       await Sender.create(userData);
//     } else if (user.role === 'vendor') {
//       await Vendor.create(userData);
//     }

//     // 6️⃣ Return AuthResponse
//     return new AuthResponse('User registered successfully', true);
//   }

//   // ---------------- Login ----------------
//   async login(loginRequest) {
//     // 1️⃣ Validate input
//     const validated = LoginValidator.validate(loginRequest);

//     // 2️⃣ Find user by email
//     const user = await User.findOne({ email: validated.email });
//     if (!user) throw new Error('Invalid email or password');

//     // 3️⃣ Check password
//     const isPasswordValid = await bcrypt.compare(validated.password, user.password);
//     if (!isPasswordValid) throw new Error('Invalid email or password');

//     // 4️⃣ Generate JWT
//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         walletAddress: user.walletAddress,
//       },
//       jwtSecret,
//       { expiresIn: '1h' } // fixed typo: expiredIn → expiresIn
//     );

//     // 5️⃣ Return token and user info
//     return {
//       token,
//       user: new AuthResponse('Login successful', true),
//     };
//   }
// }

// module.exports = AuthServiceImpl;
