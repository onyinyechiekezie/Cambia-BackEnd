const Joi = require('joi');

class CancelOrderRequestValidator {
  static schema = Joi.object({
    orderId: Joi.string().required(),
    senderWalletPrivateKey: Joi.string().required(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Cancel order validation failed: ${error.message}`);
    return value;
  }
}

module.exports = CancelOrderRequestValidator;
