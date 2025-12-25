import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 2000000 }, // Default ₹2,000,000 in smallest units used by app
  portfolio: [
    {
      symbol: String,
      quantity: Number,
      avgPrice: Number,
    }
  ]
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
