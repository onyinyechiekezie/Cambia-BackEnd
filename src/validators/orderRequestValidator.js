const Joi = require('joi');

class OrderRequestValidator {
  static schema = Joi.object({
    products: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .required(),
    trustlessSwapID: Joi.string().optional(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Order validation failed: ${error.message}`);
    return value;
  }
}

module.exports = OrderRequestValidator;