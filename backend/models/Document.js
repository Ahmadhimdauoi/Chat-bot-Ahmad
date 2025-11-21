import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  chatbot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  file_name: { type: String, required: true },
  file_path: { type: String },
  file_type: { type: String, default: 'pdf' },
  extracted_content: { type: String },
  uploaded_at: { type: Date, default: Date.now }
});

export default mongoose.model('Document', documentSchema);