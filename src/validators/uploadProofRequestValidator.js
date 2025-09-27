const Joi = require('joi');

class UploadProofRequestValidator {
  static schema = Joi.object({
    orderId: Joi.string().required(),
    proofHash: Joi.string().required(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Upload proof validation failed: ${error.message}`);
    return value;
  }
}

module.exports = UploadProofRequestValidator;
