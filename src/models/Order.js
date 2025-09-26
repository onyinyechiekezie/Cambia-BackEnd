const mongoose = require('mongoose');
const Status = require('./OrderStatus');


const OrderSchema = new mongoose.Schema({
  senderID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},  
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 },
  status: { 
    type: String,
    enum: Object.values(Status),
    default: Status.PENDING,
  },
  trustlessSwapID: { type: String }, 
  proofOfPackaging: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);