import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import botRoutes from './routes/botRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import Admin from './models/Admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Ahmad:266216@cluster0.zydwbtv.mongodb.net/Chat_bot";

// Middleware
app.use(cors()); // Allow all origins for dev simplicity
app.use(express.json());

// Static Middleware for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection and Seeding
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    
    // Seed Default Admin if not exists
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
        const defaultAdmin = new Admin({
            username: 'admin',
            password: 'password', // In production, hash this
            email: 'admin@cognitivebot.com'
        });
        await defaultAdmin.save();
        console.log("👤 Default Admin user created");
        }
    } catch (err) {
        console.error("Seeding error:", err);
    }
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use('/api/bots', botRoutes);
app.use('/api/chat', chatRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.send('Cognitive Chatbot System API is running... Use /api/bots or /api/chat');
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));