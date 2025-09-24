const User = require("./User");

class Sender extends User {
    constructor(id, firstName, lastName, phone, email, address, role, walletAddress) {
        super(id, firstName, lastName, phone, email, address, role, walletAddress);
    }
}

module.exports = Sender;