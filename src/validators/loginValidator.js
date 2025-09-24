const e = require("express");

const loginValidator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = loginValidator;