```javascript
const Joi = require('joi');

class FundOrderRequestValidator {
  static schema = Joi.object({
    orderId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    senderWalletPrivateKey: Joi.string().required(),
  });

  static validate(dto) {
    const { error, value } = this.schema.validate(dto);
    if (error) throw new Error(`Fund order validation failed: ${error.message}`);
    return value;
  }
}

module.exports = FundOrderRequestValidator;
```