class RegisterUserReq {
    constructor(email, firstName, lastName, password, walletAddress, phone, address, role) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.walletAddress = walletAddress;
        this.phone = phone;
        this.address = address;
        this.role = role;
    }
}