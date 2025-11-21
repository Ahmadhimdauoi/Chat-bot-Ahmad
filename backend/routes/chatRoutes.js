import express from 'express';
import { handleChat, getChatHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', handleChat);
router.get('/:botId/history', getChatHistory);

export default router;