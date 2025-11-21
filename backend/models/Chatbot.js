import mongoose from 'mongoose';

const chatbotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  welcomeMessage: { type: String, default: "Hello! How can I help you?" },
  systemInstruction: { type: String, default: "You are a helpful assistant." },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Chatbot', chatbotSchema);