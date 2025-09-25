const mongoose = require('mongoose');
const User = require('./User');

const VendorSchema = new mongoose.Schema({
//   vendorCode: { type: String, default: '' },
});

const Vendor = User.discriminator('vendor', VendorSchema);

module.exports = Vendor;
