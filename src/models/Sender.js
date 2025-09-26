const mongoose = require('mongoose');
const User = require('./User');
const Roles = require("./Roles")

const SenderSchema = new mongoose.Schema({
//   senderLimit: { type: Number, default: 0 },
});

const Sender = User.discriminator(Roles.SENDER, SenderSchema);

module.exports = Sender;
