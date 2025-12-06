const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 2000000 }, // Default ₹1,00,000
  portfolio: [
    {
      symbol: String,
      quantity: Number,
      avgPrice: Number,
    }
  ]
});

module.exports = mongoose.model('User', UserSchema);