class UserRegisterRes {
    constructor(message, status) {
        this.message = message;
        this.status = Boolean(status);
    }
}