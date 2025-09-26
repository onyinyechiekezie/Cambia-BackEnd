const mongoose = require('mongoose');
const User = require('./User');
const Roles = require('./Roles');

const VendorSchema = new mongoose.Schema({
    // Optional vendor-specific fields
    // vendorCode: { type: String, default: '' },
});

const Vendor = User.discriminator(Roles.VENDOR, VendorSchema);

module.exports = Vendor;
