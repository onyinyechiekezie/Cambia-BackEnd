const Joi = require('joi');

class LoginValidator {
  static schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(16).required(),
  });

  static validate(data) {
    const { error, value } = this.schema.validate(data, { abortEarly: false });
    if (error) throw new Error(`Validation error: ${error.message}`);
    return value;
  }
}

module.exports = LoginValidator;
