class UserRegisterRes {
    constructor(message, status) {
        this.message = message;
        this.status = Boolean(status);
    }
}

module.exports = UserRegisterRes;