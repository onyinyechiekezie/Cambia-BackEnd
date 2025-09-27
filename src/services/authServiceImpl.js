const AuthService = require('./authService');
const AuthResponse = require("../dtos/response/AuthResponse");
const User = require('../models/User');
const Sender = require('../models/Sender');
const Vendor = require('../models/Vendor');
const RegisterValidator = require('../validators/registerValidator')
const LoginValidator = require('../validators/loginValidator')

class AuthServiceImpl extends AuthService {
    constructor(jwtService, passwordService) {
        super();
        this.jwtService = jwtService;
        this.passwordService = passwordService;
    }

    async register(registerRequest) {
        const validated = RegisterValidator.validate(registerRequest)

        const existingUser = await User.findOne({ email: validated.email });
        if (existingUser) throw new Error("Email already exists");
        
        const hashedPassword =  await bcrypt.hash(validated.password, 10);
        const userData = { ...validated, password: hashedPassword };

        const model = userData.role === "sender" ? Sender : Vendor;
        await model.create(userData);
        return new AuthResponse("User registered successfully", true)
    }

    async login(loginRequest) {
        const validated = LoginValidator.validate(loginRequest);

        const user = await User.findOne({ email: validated.email})
        if(!user) throw new Error("Invalid credentials");

        const isPasswordValid = await bcrypt.compare(validated.password, user.password);
        if(!isPasswordValid) throw new Error("Invalid credentials");

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, walletAddress: user.walletAddress },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );
        return { token, user: new AuthResponse("Login successful", true) }
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, jwtSecret);
        } catch(error) {
            throw new Error("Invalid or expired");
        }
    }
}

module.exports = AuthServiceImpl