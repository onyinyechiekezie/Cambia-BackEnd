const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // auto-lowers
    trim: true
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  password: { type: String, required: true },
  walletAddress: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { type: String, trim: true },
  address: { type: String },
  role: {
    type: String,
    enum: ["sender", "recipient", "admin"], // ✅ restrict roles
    default: "sender"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
