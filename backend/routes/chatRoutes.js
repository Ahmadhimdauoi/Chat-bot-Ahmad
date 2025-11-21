import express from 'express';
import { handleChat, getChatHistory, registerUser } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', handleChat);
router.post('/user', registerUser);
router.get('/:botId/history', getChatHistory);

export default router;