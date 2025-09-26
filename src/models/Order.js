
const { required } = require('joi');
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
//   orderID: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  senderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender', required: true },
  vendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],  
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'received', 'prepared', 'proof_uploaded', 'shipped', 'delivered'],
    default: 'pending'
  },
  trustlessSwapID: { type: String }, 
  proofOfPackaging: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
