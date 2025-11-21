const API_BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const loginAdmin = async (key: string) => {
  // Mock login for now as per original requirement
  return { token: 'admin-session-active' };
};

export const listBots = async () => {
  const response = await fetch(`${API_BASE_URL}/bots`);
  return handleResponse(response);
};

export const createBot = async (name: string, welcomeMessage: string) => {
  const response = await fetch(`${API_BASE_URL}/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, welcomeMessage }),
  });
  return handleResponse(response);
};

export const deleteBot = async (botId: string) => {
  const response = await fetch(`${API_BASE_URL}/bots/${botId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const uploadFile = async (botId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('botId', botId);

  const response = await fetch(`${API_BASE_URL}/bots/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};