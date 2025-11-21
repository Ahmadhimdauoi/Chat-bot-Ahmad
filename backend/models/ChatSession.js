import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  chatbot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  started_at: { type: Date, default: Date.now }
});

export default mongoose.model('ChatSession', chatSessionSchema);