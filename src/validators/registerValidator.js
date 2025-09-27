const Joi = require("joi");

class RegisterValidator {
    static schema = Joi.object({
        email: Joi.string().email().required()
         .messages({
        'any.only': 'Invalid email',
        'string.empty': 'Email is required'
      }),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().min(8).max(16).required(),
        walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
        phone: Joi.string().min(10).max(15).optional(),
        address: Joi.string().optional(),
        role: Joi.string().valid("sender", "vendor").required()
        .messages({
        'any.only': 'Invalid role',
        'any.required': 'Role is required',
        'string.empty': 'Role is required'
      })
    });
    

    static validate(data) {
    const { error, value } = this.schema.validate(data, { abortEarly: false });
    if (error) throw new Error(error.message);
    return value;
  }
};

module.exports = RegisterValidator;