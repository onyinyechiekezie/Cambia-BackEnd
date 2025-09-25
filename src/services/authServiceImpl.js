const AuthService = require('./authService');
const RegisterRequest = require("../dtos/request/userRegisterReq");
const AuthResponse = require("../dtos/response/AuthResponse")

class AuthServiceImpl extends AuthService {
    constructor() {
        super();
    }

    async register(registerRequest) {
        const validated = RegisterRequest.validate(authData)
    }

}