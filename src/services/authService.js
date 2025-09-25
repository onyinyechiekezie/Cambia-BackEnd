class AuthService {

    constructor() {
        if(new.target === AuthService) {
            throw new Error("Cannot instantiate abstract class AuthService directly");
        }
    }
    async register(registerRequest) {
        throw new Error("Method not implemented.");
    };

    async login(loginRequest) {
        throw new Error("Method not implemented.");
    }
}

module.exports = AuthService;