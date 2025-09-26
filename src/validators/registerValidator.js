const Joi = require("joi");

class RegisterValidator {
    static schema = Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().min(8).max(16).required(),
        walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
        phone: Joi.string().min(10).max(15).optional(),
        address: Joi.string().optional(),
        role: Joi.string().valid("sender", "vendor").required(),
    });

    static validate(data) {
    const { error, value } = this.schema.validate(data, { abortEarly: false });
    if (error) throw new Error(`Validation error: ${error.message}`);
    return value;
  }
};

module.exports = RegisterValidator;