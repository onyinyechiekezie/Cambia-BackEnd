
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, default: 'pending' }, // pending -> acknowledged -> prepared -> proof_uploaded -> shipped -> delivered
  proofOfPackaging: { type: String }, // URL or path
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
