
  phone: { type: String, trim: true },
  address: { type: String },
  role: {
    type: String,
    enum: Object.values(Roles), // ✅ uses Role constants
    default: Roles.SENDER,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
