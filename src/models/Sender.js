const mongoose = require('mongoose');
const User = require('./User');

const SenderSchema = new mongoose.Schema({
//   senderLimit: { type: Number, default: 0 },
});

const Sender = User.discriminator('sender', SenderSchema);

module.exports = Sender;
