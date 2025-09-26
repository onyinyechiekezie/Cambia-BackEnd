const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },                
  description: { type: String },                          
  price: { type: Number, required: true },               
  quantityAvailable: { type: Number, required: true },    // Stock available
  unit: { type: String, required: true },                 // Unit (kg, pcs, etc.)
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' }, 
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true } 
}, { timestamps: true })

module.exports = mongoose.model('Product', ProductSchema);
