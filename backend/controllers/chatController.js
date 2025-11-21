import Chatbot from '../models/Chatbot.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import Message from '../models/Message.js';
import { GoogleGenAI } from '@google/genai';

// Fetch Chat History for a user and bot
export const getChatHistory = async (req, res) => {
  try {
    const { botId } = req.params;
    const { apiKey } = req.query;

    if (!apiKey) {
      return res.status(400).json({ error: "API Key required to fetch history" });
    }

    // Identify User by API Key
    const user = await User.findOne({ private_key: apiKey });
    if (!user) {
      // New user or invalid key, return empty history
      return res.json([]); 
    }

    // Find the most recent session
    const session = await ChatSession.findOne({ 
      chatbot_id: botId, 
      user_id: user._id 
    }).sort({ started_at: -1 });

    if (!session) {
      return res.json([]);
    }

    // Retrieve messages for this session
    const messages = await Message.find({ session_id: session._id }).sort({ sent_at: 1 });

    // Format for Frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      content: msg.content
    }));

    res.json(formattedMessages);

  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

export const handleChat = async (req, res) => {
  try {
    const { botId, message, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required to use this bot." });
    }

    // 1. Verify Chatbot
    const bot = await Chatbot.findById(botId);
    if (!bot) return res.status(404).json({ error: "Bot not found" });

    // 2. Find or Create User based on API Key
    let user = await User.findOne({ private_key: apiKey });
    if (!user) {
      user = new User({
        username: `User_${Date.now().toString().slice(-6)}`,
        private_key: apiKey
      });
      await user.save();
    }

    // 3. Find or Create Active Chat Session
    let session = await ChatSession.findOne({ 
      chatbot_id: botId, 
      user_id: user._id 
    }).sort({ started_at: -1 });

    if (!session) {
      session = new ChatSession({
        chatbot_id: botId,
        user_id: user._id
      });
      await session.save();
    }

    // 4. Save User Message
    const userMsg = new Message({
      session_id: session._id,
      sender: 'user',
      content: message
    });
    await userMsg.save();

    // 5. RAG: Fetch Context
    const docs = await Document.find({ chatbot_id: botId });
    const context = docs.map(doc => doc.extracted_content).join("\n\n---\n\n");

    // 6. Generate AI Response
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemPrompt = bot.prompt_instruction || "You are a helpful assistant.";
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

    // 7. Save Bot Message
    const botMsg = new Message({
      session_id: session._id,
      sender: 'bot',
      content: aiText
    });
    await botMsg.save();

    // 8. Return Response
    res.json({ 
      role: 'assistant', 
      content: aiText,
      sessionId: session._id 
    });

  } catch (error) {
    console.error("Chat error:", error);
    if (error.message && error.message.includes('API key')) {
       return res.status(401).json({ error: "Invalid Google Gemini API Key provided." });
    }
    res.status(500).json({ error: "AI processing failed. Please check your key or try again." });
  }
};