const Joi = require("joi");
const Roles = require("../models/Roles");

const registerValidator = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(50).required(),
});