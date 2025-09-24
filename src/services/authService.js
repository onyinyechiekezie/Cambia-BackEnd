class AuthService {

    constructor() {
        if(new.target === AuthService) {
            throw new Error("Cannot instantiate abstract class AuthService directly");
        }
    }
    async register(userData) {
        throw new Error("Method not implemented.");
    };

    async login(userCredentials) {
        throw new Error("Method not implemented.");
    }
}

module.exports = AuthService;