const Joi = require('joi');

class LoginValidator {
  static schema = Joi.object({
    email: Joi.string().email().required()
     .messages({
        'any.only': 'Invalid credentials',
        'any required': 'credentials is required',
        'string.empty': 'email is required'
      }),
    password: Joi.string().min(8).max(16).required()
    .messages({
        'any.only': 'Invalid credentials',
        'any required': 'credentials is required',
        'string.empty': 'password is required'
      })
  });

  static validate(data) {
    const { error, value } = this.schema.validate(data, { abortEarly: false });
    if (error) throw new Error(error.message);
    return value;
  }
}

module.exports = LoginValidator;
