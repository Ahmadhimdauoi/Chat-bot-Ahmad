
export interface Bot {
  _id: string;
  name: string;
  welcomeMessage: string;
  systemInstruction?: string;
  createdAt: string;
}

export interface KnowledgeBase {
  _id: string;
  botId: string;
  filename: string;
  uploadDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sessionId?: string;
}