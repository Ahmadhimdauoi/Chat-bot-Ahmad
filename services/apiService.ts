import type { Bot, KnowledgeBase, ChatMessage } from '../types';

// In production, the API is served from the same origin.
// In development, we point to the express server port.
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : '/api';

// --- Helper Functions ---

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// --- API Functions ---

/**
 * Admin Login (Simple Pass-through)
 * Since the requirements only specify backend endpoints for Bots and Chat,
 * we handle auth validation on the client side for this demo.
 */
export const loginAdmin = async (key: string): Promise<{ token: string }> => {
  // In a real SaaS, this would validate against a /api/login endpoint.
  return { token: 'admin-session-active' };
};

/**
 * Fetches all bots from the backend.
 */
export const listBots = async (): Promise<Bot[]> => {
  const response = await fetch(`${API_BASE_URL}/bots`);
  return handleResponse(response);
};

/**
 * Fetches a single bot by ID.
 */
export const getBot = async (botId: string): Promise<Bot> => {
  const response = await fetch(`${API_BASE_URL}/bots/${botId}`);
  return handleResponse(response);
};

/**
 * Creates a new bot.
 */
export const createBot = async (name: string, welcomeMessage: string): Promise<Bot> => {
  const response = await fetch(`${API_BASE_URL}/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, welcomeMessage }),
  });
  return handleResponse(response);
};

/**
 * Uploads a PDF file for a specific bot.
 */
export const uploadFile = async (botId: string, file: File): Promise<KnowledgeBase> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('botId', botId);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};

/**
 * Sends a chat message to the backend.
 * Now requires apiKey.
 */
export const sendChatMessage = async (botId: string, message: string, apiKey: string): Promise<ChatMessage> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId, message, apiKey }),
  });
  
  const data = await handleResponse(response);
  
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.content
  };
};