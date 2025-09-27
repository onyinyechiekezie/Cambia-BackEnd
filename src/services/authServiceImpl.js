const bcrypt = require('bcrypt');
const AuthService = require('./authService');
const AuthResponse = require("../dtos/response/AuthResponse");
const User = require('../models/User');
const Sender = require('../models/Sender');
const Vendor = require('../models/Vendor');
const RegisterValidator = require('../validators/registerValidator');
const LoginValidator = require('../validators/loginValidator');
const JwtService = require("./jwtService")
const { jwtSecret, jwtExpiresIn} = require("../config/env")

class AuthServiceImpl extends AuthService {
    constructor(jwtService = new JwtService(jwtSecret, jwtExpiresIn)) {
        super();
        this.jwtService = jwtService;
    }

    async register(registerRequest) {
        const validated = RegisterValidator.validate(registerRequest);

        const existingUser = await User.findOne({ email: validated.email });
        if (existingUser) throw new Error("Email already exists");

        // Hash password using bcrypt directly
        const hashedPassword = await bcrypt.hash(validated.password, 10);
        const userData = { ...validated, password: hashedPassword };

        const model = userData.role === "sender" ? Sender : Vendor;
        await model.create(userData);
        return new AuthResponse("User registered successfully", true);
    }

    async login(loginRequest) {
        const validated = LoginValidator.validate(loginRequest);

        const user = await User.findOne({ email: validated.email });
        if (!user) throw new Error("Invalid credentials");

        // Compare password using bcrypt directly
        const isPasswordValid = await bcrypt.compare(validated.password, user.password);
        if (!isPasswordValid) throw new Error("Invalid credentials");

        // Use jwtService to sign token (recommended)
        const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            walletAddress: user.walletAddress
        });

        return { token, user: new AuthResponse("Login successful", true) };
    }

    verifyToken(token) {
        try {
            return this.jwtService.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired');
        }
    }
}

module.exports = AuthServiceImpl;
