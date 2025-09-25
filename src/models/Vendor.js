const mongoose = require('mongoose');
const userSchema = require('./User').schema;

const vendorSchema = new mongoose.Schema(userSchema.obj);

module.exports = mongoose.model('Sendor', vendorSchema);
