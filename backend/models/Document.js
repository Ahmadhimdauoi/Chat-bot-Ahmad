
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  chatbot_id: { type: String, required: true }, // Changed from ObjectId/Ref to String
  file_name: { type: String, required: true },
  file_path: { type: String },
  file_type: { type: String, default: 'pdf' },
  extracted_content: { type: String },
  uploaded_at: { type: Date, default: Date.now }
});

export default mongoose.model('Document', documentSchema);
