import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Ahmad:266216@cluster0.zydwbtv.mongodb.net/Chat_bot";

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Multer setup for memory storage (we process PDF immediately)
const upload = multer({ storage: multer.memoryStorage() });

// --- MongoDB Schemas ---
const botSchema = new mongoose.Schema({
  name: { type: String, required: true },
  welcomeMessage: { type: String, default: "Hello! How can I help you?" },
  systemInstruction: { type: String, default: "You are a helpful assistant." },
  createdAt: { type: Date, default: Date.now }
});

const knowledgeBaseSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  filename: String,
  textContent: String, // Extracted text
  uploadDate: { type: Date, default: Date.now }
});

const Bot = mongoose.model('Bot', botSchema);
const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

// --- API Routes ---

// 1. Get All Bots
app.get('/api/bots', async (req, res) => {
  try {
    const bots = await Bot.find().sort({ createdAt: -1 });
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Single Bot (Public)
app.get('/api/bots/:id', async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) return res.status(404).json({ error: "Bot not found" });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create Bot
app.post('/api/bots', async (req, res) => {
  try {
    const { name, welcomeMessage, systemInstruction } = req.body;
    const newBot = new Bot({ name, welcomeMessage, systemInstruction });
    await newBot.save();
    res.status(201).json(newBot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Upload PDF & Extract Text
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { botId } = req.body;
    if (!req.file || !botId) {
      return res.status(400).json({ error: "File and botId are required" });
    }

    // Extract text from PDF buffer
    const data = await pdf(req.file.buffer);
    const textContent = data.text;

    // Save to KnowledgeBase
    const kbEntry = new KnowledgeBase({
      botId,
      filename: req.file.originalname,
      textContent
    });
    await kbEntry.save();

    res.status(201).json(kbEntry);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// 5. Chat Endpoint (RAG + Gemini)
app.post('/api/chat', async (req, res) => {
  try {
    const { botId, message, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required to use this bot." });
    }

    // Fetch Bot Settings
    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ error: "Bot not found" });

    // Fetch Knowledge Base
    const docs = await KnowledgeBase.find({ botId });
    const context = docs.map(doc => doc.textContent).join("\n\n---\n\n");

    // Initialize Gemini with the USER Provided Key
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Construct Prompt
    const fullPrompt = `
      System Instruction: ${bot.systemInstruction || "You are a helpful assistant."}
      
      Context Information:
      ${context ? context.substring(0, 30000) : "No specific context provided."} 
      
      User Question: ${message}
      
      Answer based on the context provided if relevant. If not, use general knowledge but prioritize the context.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    res.json({ 
      role: 'assistant', 
      content: response.text 
    });

  } catch (error) {
    console.error("Chat error:", error);
    // Check for specific Gemini API errors (like invalid key)
    if (error.message && error.message.includes('API key')) {
       return res.status(401).json({ error: "Invalid Google Gemini API Key provided." });
    }
    res.status(500).json({ error: "AI processing failed. Please check your key or try again." });
  }
});

// --- Static Files (Frontend) ---
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Server Start ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB Connection Error:", err));