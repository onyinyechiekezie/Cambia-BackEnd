const AuthService = require('./authService');
const RegisterRequest = require("../dtos/request/userRegisterReq");
const AuthResponse = require("../dtos/response/AuthResponse");
const User = require('../models/User');

class AuthServiceImpl extends AuthService {
    constructor() {
        super();
    }

    async register(registerRequest) {
        const validated = RegisterRequest.validate(registerRequest)

        const existingUser = await User.findOne({ email: validated.email });
        if (existing) throw new Error("Enail already exists");
        
        
    }

}