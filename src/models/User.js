const Roles = require('./Roles');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {type: String, unique: true},
    email: { type: String, unique: true, lowercase: true, trim: true },
    firstName: { type: String },
    lastName: {type: String},
    password: {type: String},
    walletAddress: { type: String, unique: true, required: true, },
    phone: {type: String, trim: true},
    address: {type: String},
    role: { type: String, enum: Object.values(Roles), default: Roles.SENDER, },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
