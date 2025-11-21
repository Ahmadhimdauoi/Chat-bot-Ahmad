import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  private_key: { type: String, required: true }, // Gemini API Key
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);