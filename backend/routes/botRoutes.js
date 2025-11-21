import express from 'express';
import multer from 'multer';
import { getAllBots, getBotById, createBot, uploadDocument } from '../controllers/botController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAllBots);
router.get('/:id', getBotById);
router.post('/', createBot);
router.post('/upload', upload.single('file'), uploadDocument);

export default router;