const Joi = require("joi");

class OrderRequestValidator {
    static schema = Joi.object({
        vendorID: Joi.string().required(),
        products: Joi.array().items(
            Joi.object({
                productId: Joi.string().required(),         
                quantity: Joi.number().integer().min(1).required()
            })
        ).min(1).required(),
        trustlessSwapID: Joi.string().optional()
    });

    static validate(orderRequest) {
        const { error, value } = this.schema.validate(orderRequest);
        if (error) throw new Error(`Order validation failed: ${error.message}`);
        return value;
    }
}

module.exports = OrderRequestValidator;

