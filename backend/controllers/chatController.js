import Chatbot from '../models/Chatbot.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import { GoogleGenAI } from '@google/genai';

// Fetch Chat History - Disabled (Returns empty array)
export const getChatHistory = async (req, res) => {
  res.json([]);
};

// Register or Update User
export const registerUser = async (req, res) => {
  try {
    const { username, apiKey } = req.body;
    if (!username || !apiKey) {
      return res.status(400).json({ error: "Username and API Key are required" });
    }

    // Find and update user, or create new one if doesn't exist
    const user = await User.findOneAndUpdate(
      { username },
      { private_key: apiKey },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "User registered", userId: user._id });
  } catch (error) {
    console.error("Register User Error:", error);
    res.status(500).json({ error: "Failed to save user data" });
  }
};

export const handleChat = async (req, res) => {
  try {
    const { botId, message, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required to use this bot." });
    }

    // 0. Fetch Bot Metadata (System Instruction)
    const bot = await Chatbot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // 1. RAG: Fetch Context
    const docs = await Document.find({ chatbot_id: botId });
    const context = docs.map(doc => doc.extracted_content).join("\n\n---\n\n");

    // 2. Generate AI Response
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemPrompt = bot.systemInstruction || "You are a helpful assistant. Use the provided context to answer questions.";
    const fullPrompt = `
    ${systemPrompt}

    Instructions:
    Use the following extracted text from the PDF document to answer the user's question.
    If the answer is not in the text, strictly say "The answer is not available in the provided documents."
    Use Markdown for formatting.

    Extracted Text: 
    ${context ? context.substring(0, 50000) : "No document context available."}

    User Question: 
    ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    const aiText = response.text;

    // 3. Return Response (Stateless)
    res.json({ 
      role: 'assistant', 
      content: aiText
    });

  } catch (error) {
    console.error("Chat error:", error);
    if (error.message && error.message.includes('API key')) {
       return res.status(401).json({ error: "Invalid Google Gemini API Key provided." });
    }
    res.status(500).json({ error: "AI processing failed. Please check your key or try again." });
  }
};