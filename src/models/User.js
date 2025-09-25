
const mongoose = require('mongoose');

const options = { discriminatorKey: 'role', timestamps: true };

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: {type: String},
    walletAddress: { type: String, required: true, unique: true },
    address: { type: String, required: true },
}, options);

const User = mongoose.model('User', UserSchema);

module.exports = User;
