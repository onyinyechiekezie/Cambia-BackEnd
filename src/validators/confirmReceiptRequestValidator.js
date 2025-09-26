const Joi = require('joi');

class ConfirmReceiptRequestValidator {
  static schema = Joi.object({
    orderId: Joi.string().required(),
    unlockKey: Joi.string().required(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Confirm receipt validation failed: ${error.message}`);
    return value;
  }
}

module.exports = ConfirmReceiptRequestValidator;
