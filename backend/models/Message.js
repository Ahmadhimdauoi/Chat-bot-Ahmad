import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  sent_at: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);