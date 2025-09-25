const mongoose = require('mongoose');
const userSchema = require('./User').schema;

const senderSchema = new mongoose.Schema(userSchema.obj);

module.exports = mongoose.model('Sender', senderSchema);
