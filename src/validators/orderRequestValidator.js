const Joi = require("joi");

class OrderRequestValidator {
    static schema = Joi.object({
        senderID: Joi.string().required(),
        vendorID: Joi.string().required(),
        productName: Joi.string().required(),
        quantity: Joi.number().integer().required(),
        amount: Joi.number().required(),
        status: Joi.string(),
        trustlessSwapID: Joi.string().required()
    })
}

module.exports = OrderRequestValidator;