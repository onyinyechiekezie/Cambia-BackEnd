const Joi = require("joi");
const Roles = require("../models/Roles");

const registerValidator = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(50).required(),
    labeledStatement: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(8).max(16).required(),
    walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
    phone: Joi.string().min(10).max(15).optional(),
    address: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(Roles)).default(Roles.SENDER),
});

module.exports = registerValidator;