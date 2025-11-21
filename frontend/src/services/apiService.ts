
// Points to the Backend URL
const API_BASE_URL = 'http://localhost:5000/api';

export const getBot = async (botId: string) => {
  const response = await fetch(`${API_BASE_URL}/bots/${botId}`);
  if (!response.ok) throw new Error('Failed to fetch bot');
  return response.json();
};

export const registerUser = async (username: string, apiKey: string) => {
  const response = await fetch(`${API_BASE_URL}/chat/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, apiKey }),
  });
  
  if (!response.ok) {
     const data = await response.json();
     throw new Error(data.error || 'Failed to register user');
  }
  return response.json();
};

export const fetchChatHistory = async (botId: string, apiKey: string) => {
  const response = await fetch(`${API_BASE_URL}/chat/${botId}/history?apiKey=${encodeURIComponent(apiKey)}`);
  if (!response.ok) return [];
  return response.json();
};

export const sendChatMessage = async (botId: string, message: string, apiKey: string) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId, message, apiKey }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to send message');
  return {
    id: Date.now().toString(),
    role: 'assistant' as const,
    content: data.content
  };
};