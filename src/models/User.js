
const Roles = require('./Roles');

class User {
    constructor(id, firstName, lastName, phone, email, address, role, walletAddress) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.role = Object.values(Roles).includes(role);
        this.walletAddress = walletAddress;
    }
}

module.exports = User;
