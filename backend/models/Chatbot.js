import mongoose from 'mongoose';

const chatbotSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  name: { type: String, required: true },
  prompt_instruction: { type: String, default: "You are a helpful assistant." },
  welcome_message: { type: String, default: "Hello! How can I help you?" },
  api_key_required: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Chatbot', chatbotSchema);