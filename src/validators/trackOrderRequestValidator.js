const Joi = require('joi');

class TrackOrderRequestValidator {
  static schema = Joi.object({
    orderId: Joi.string().required(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Track order validation failed: ${error.message}`);
    return value;
  }
}

module.exports = TrackOrderRequestValidator;
