
const mongoose = require('mongoose');
const Roles = require("./Roles");

const options = { discriminatorKey: 'role', timestamps: true };

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String },
    walletAddress: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    role: { type: String, enum: Object.values(Roles), required: true }, // fixed
}, options);

const User = mongoose.model('User', UserSchema);

module.exports = User;

