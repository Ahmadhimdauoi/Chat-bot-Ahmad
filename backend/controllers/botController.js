import Chatbot from '../models/Chatbot.js';
import Document from '../models/Document.js';
import Admin from '../models/Admin.js';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get the default admin for this demo
const getDefaultAdminId = async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  return admin ? admin._id : null;
};

// Get all bots with their documents
export const getAllBots = async (req, res) => {
  try {
    // Use aggregation to join documents with chatbots
    const bots = await Chatbot.aggregate([
      {
        $lookup: {
          from: 'documents', // The collection name for Document model
          localField: '_id',
          foreignField: 'chatbot_id',
          as: 'documents'
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]);
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single bot
export const getBotById = async (req, res) => {
  try {
    const { id } = req.params;
    const bot = await Chatbot.findById(id);
    if (!bot) return res.status(404).json({ error: "Bot not found" });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new bot
export const createBot = async (req, res) => {
  try {
    const { name, welcomeMessage, systemInstruction } = req.body;
    
    const newBot = new Chatbot({
      name,
      welcomeMessage,
      systemInstruction
    });
    
    await newBot.save();
    
    // Return object consistent with aggregation structure
    const botObject = newBot.toObject();
    botObject.documents = [];
    
    res.status(201).json(botObject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Bot
export const deleteBot = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find documents to delete physical files
    const documents = await Document.find({ chatbot_id: id });
    
    documents.forEach(doc => {
        if (doc.file_path) {
            const fullPath = path.join(__dirname, '..', doc.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
    });

    // 2. Delete Documents from DB
    await Document.deleteMany({ chatbot_id: id });

    // 3. Delete Chatbot
    await Chatbot.findByIdAndDelete(id);

    res.json({ message: "Bot deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upload Document and Save File locally
export const uploadDocument = async (req, res) => {
  try {
    const { botId } = req.body;
    if (!req.file || !botId) {
      return res.status(400).json({ error: "File and botId are required" });
    }

    // Verify bot exists
    const bot = await Chatbot.findById(botId);
    if (!bot) {
        return res.status(404).json({ error: "Chatbot not found" });
    }

    // 1. Extract text from PDF buffer (for RAG)
    const data = await pdf(req.file.buffer);
    const textContent = data.text;

    // 2. Prepare Upload Directory
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Generate safe filename and save to disk
    const timestamp = Date.now();
    const safeFilename = req.file.originalname.replace(/\s+/g, '_');
    const filename = `${timestamp}-${safeFilename}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    // 4. Save metadata to Document Table
    const docEntry = new Document({
      chatbot_id: botId,
      file_name: req.file.originalname,
      file_path: `/uploads/${filename}`, // Web-accessible path
      extracted_content: textContent,
      file_type: 'pdf'
    });
    
    await docEntry.save();

    res.status(201).json({
        _id: docEntry._id,
        botId: docEntry.chatbot_id,
        filename: docEntry.file_name,
        filePath: docEntry.file_path,
        uploadDate: docEntry.uploaded_at
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
};