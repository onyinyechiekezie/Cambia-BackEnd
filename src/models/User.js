const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {type: String, unique: true},
    email: {type: String, unique: true},
    firstName: {type: String},
    lastName: {type: String},
    password: {type: String},
    walletAddress: {type: String},
    phone: {type: String},
    address: {type: String},
    role: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
