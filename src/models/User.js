class User {
	constructor(id, firstName, lastName, phone, email, address, role, walletAddress) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
		this.email = email;
		this.address = address;
        this.role = role; // 'sender' or 'receiver'
	}
}

module.exports = User;
