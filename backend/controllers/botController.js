import Chatbot from '../models/Chatbot.js';
import Document from '../models/Document.js';
import Admin from '../models/Admin.js';
import pdf from 'pdf-parse';

// Helper to get the default admin for this demo
const getDefaultAdminId = async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  return admin ? admin._id : null;
};

// Get all bots
export const getAllBots = async (req, res) => {
  try {
    const bots = await Chatbot.find().sort({ created_at: -1 });
    
    const mappedBots = bots.map(bot => ({
      _id: bot._id,
      name: bot.name,
      welcomeMessage: bot.welcome_message,
      systemInstruction: bot.prompt_instruction,
      createdAt: bot.created_at
    }));

    res.json(mappedBots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single bot
export const getBotById = async (req, res) => {
  try {
    const bot = await Chatbot.findById(req.params.id);
    if (!bot) return res.status(404).json({ error: "Bot not found" });
    
    res.json({
      _id: bot._id,
      name: bot.name,
      welcomeMessage: bot.welcome_message,
      systemInstruction: bot.prompt_instruction,
      createdAt: bot.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new bot
export const createBot = async (req, res) => {
  try {
    const { name, welcomeMessage, systemInstruction } = req.body;
    let adminId = await getDefaultAdminId();
    
    if (!adminId) {
        // Create default admin if not exists (failsafe)
        const newAdmin = new Admin({ username: 'admin', password: 'password', email: 'admin@test.com' });
        await newAdmin.save();
        adminId = newAdmin._id;
    }

    const newBot = new Chatbot({ 
      admin_id: adminId,
      name, 
      welcome_message: welcomeMessage, 
      prompt_instruction: systemInstruction 
    });
    
    await newBot.save();
    
    res.status(201).json({
      _id: newBot._id,
      name: newBot.name,
      welcomeMessage: newBot.welcome_message,
      createdAt: newBot.created_at
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