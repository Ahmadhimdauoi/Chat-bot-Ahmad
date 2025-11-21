
import Document from '../models/Document.js';
import Admin from '../models/Admin.js';
import pdf from 'pdf-parse';

// Helper to get the default admin for this demo
const getDefaultAdminId = async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  return admin ? admin._id : null;
};

// Get all bots
// Since 'Chatbot' table is deleted, we fetch active bot IDs from Documents
export const getAllBots = async (req, res) => {
  try {
    // Find all unique chatbot_ids from the Document collection
    const uniqueBotIds = await Document.distinct('chatbot_id');
    
    // Map them to mock Bot objects so the frontend can display them
    const bots = uniqueBotIds.map(id => ({
      _id: id,
      name: `Knowledge Base (${id.substr(-4)})`, // Generate a generic name or use ID
      welcomeMessage: "Hello! How can I help you with the uploaded documents?",
      systemInstruction: "You are a helpful assistant.",
      createdAt: new Date()
    }));

    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single bot
export const getBotById = async (req, res) => {
  try {
    const { id } = req.params;
    // Return a generic bot object since we don't store metadata anymore
    res.json({
      _id: id,
      name: "Knowledge Assistant",
      welcomeMessage: "Hello! Ask me anything about the context.",
      systemInstruction: "You are a helpful assistant.",
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new bot
// Since we don't have a table, we just return a valid object to the frontend.
// The bot "persists" only when a document is uploaded with this ID.
export const createBot = async (req, res) => {
  try {
    const { name, welcomeMessage, systemInstruction } = req.body;
    const newId = Date.now().toString(); // Simple ID generation

    res.status(201).json({
      _id: newId,
      name: name, // Frontend will see the name immediately
      welcomeMessage: welcomeMessage,
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload Document
export const uploadDocument = async (req, res) => {
  try {
    const { botId } = req.body;
    if (!req.file || !botId) {
      return res.status(400).json({ error: "File and botId are required" });
    }

    // Extract text from PDF buffer
    const data = await pdf(req.file.buffer);
    const textContent = data.text;

    // Save to Document Table
    const docEntry = new Document({
      chatbot_id: botId,
      file_name: req.file.originalname,
      extracted_content: textContent,
      file_type: 'pdf'
    });
    
    await docEntry.save();

    res.status(201).json({
        _id: docEntry._id,
        botId: docEntry.chatbot_id,
        filename: docEntry.file_name,
        uploadDate: docEntry.uploaded_at
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
};
