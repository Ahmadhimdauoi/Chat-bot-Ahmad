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
    
    // Improved Context Formatting: Include Filename and remove strict small limits
    // Gemini 1.5/2.5 Flash has a ~1M token window (approx 4MB of text). 
    // We limit to roughly 3,000,000 characters to be safe but allow many PDFs.
    const context = docs.map(doc => {
        return `--- START OF FILE: ${doc.file_name} ---\n${doc.extracted_content}\n--- END OF FILE: ${doc.file_name} ---`;
    }).join("\n\n");

    // 2. Generate AI Response
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemPrompt = bot.systemInstruction || "You are a helpful assistant. Use the provided context to answer questions.";
    
    // We trim strictly to avoid nodejs memory issues if files are absolutely massive, 
    // but 2.5 million chars is enough for approx 10-15 text-heavy books.
    const safeContext = context ? context.substring(0, 2500000) : "No document context available.";

    const fullPrompt = `
    ${systemPrompt}

    Instructions:
    You have access to the following documents. Use the content within them to answer the user's question accurately.
    - If the answer is found in a specific file, implicitly reference it (e.g., "According to Chapter 1...").
    - If the answer is not in the text, strictly say "The answer is not available in the provided documents."
    - Use Markdown for formatting.

    STRICT FORMATTING RULES FOR ACCOUNTING:
    1. **Journal Entries (القيود اليومية)**: 
       You MUST use a Markdown table for every journal entry. 
       You MUST follow this exact row structure for each entry:
       
       | التاريخ (Date) | البيان (Description/Account) | مدين (Debit) | دائن (Credit) |
       | :--- | :--- | :--- | :--- |
       | [Date] | من حـ/ [Debit Account] | [Amount] | |
       | | إلى حـ/ [Credit Account] | | [Amount] |
       | | [Description/Explanation] | | |

       *Important*: 
       - Put the Debit account (من حـ/...) on the first row.
       - Put the Credit account (إلى حـ/...) on the second row.
       - Put the Description on the third row.
       - Leave cells empty if they don't apply to that row (e.g. Date only on first row).
       - Do NOT merge cells.
       - Do NOT use code blocks for tables.
    
    2. **Financial Statements**:
       - Use tables for Balance Sheets, Income Statements, and Trial Balances.
       - Ensure numbers are clearly formatted.
    
    3. **General**:
       - Make sure the output is visually clean.
       - Use bold text for Account Names if helpful.

    User Question: 
    ${message}
    
    Document Context: 
    ${safeContext}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash models are best for large context windows
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
    if (error.message && error.message.includes('429')) {
       return res.status(429).json({ error: "Too many requests or quota exceeded. Please try again later." });
    }
    res.status(500).json({ error: "AI processing failed. Please check your key or try again." });
  }
};