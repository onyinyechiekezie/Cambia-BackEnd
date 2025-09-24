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
const Joi = require("joi");
const Roles = require("../models/Roles");

const registerValidator = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(8).required(),
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  phone: Joi.string().min(10).max(15).optional(),
  address: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(Roles)).default(Roles.SENDER),
});

const loginValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  registerValidator,
  loginValidator,
};
