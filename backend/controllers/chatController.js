import Chatbot from '../models/Chatbot.js';
import Document from '../models/Document.js';
import { GoogleGenAI } from '@google/genai';

// Fetch Chat History - Disabled (Returns empty array)
export const getChatHistory = async (req, res) => {
  res.json([]);
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

    // 2. RAG: Fetch Context
    const docs = await Document.find({ chatbot_id: botId });
    const context = docs.map(doc => doc.extracted_content).join("\n\n---\n\n");

    // 3. Generate AI Response
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

    // 4. Return Response (Stateless)
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