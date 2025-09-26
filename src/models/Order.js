
const { required } = require('joi');
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
<<<<<<< HEAD
  orderID: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  senderID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  products: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},  
=======
//   orderID: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  senderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender', required: true },
  vendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],  
>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'received', 'prepared', 'proof_uploaded', 'shipped', 'delivered'],
    default: 'pending'
  },
<<<<<<< HEAD
  trustlessSwapID: { type: String }, // for linking blockchain transaction
  proofOfPackaging: { type: String }, // extra: matches your code
=======
  trustlessSwapID: { type: String }, 
  proofOfPackaging: { type: String },
>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
