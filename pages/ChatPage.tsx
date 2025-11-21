import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { ChatMessage as Message, Bot } from '../types';
import { sendChatMessage, getBot } from '../services/apiService';
import PaperAirplaneIcon from '../components/icons/PaperAirplaneIcon';
import Spinner from '../components/Spinner';
import KeyIcon from '../components/icons/KeyIcon'; // Assuming this exists or used as fallback

const ChatMessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-xl text-sm md:text-base ${
          isAssistant
            ? 'bg-background text-text-primary rounded-bl-none border border-border'
            : 'bg-primary text-white rounded-br-none shadow-md'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();

  const [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth State
  const [userApiKey, setUserApiKey] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // Initial Load of Bot details
  useEffect(() => {
    const loadBot = async () => {
        if (!botId) return;
        try {
            const botData = await getBot(botId);
            setBot(botData);
        } catch (err: any) {
            setError("Bot not found or deleted.");
        } finally {
            setIsLoadingBot(false);
        }
    };
    loadBot();
  }, [botId]);

  // Initialize Chat messages only after access is granted
  useEffect(() => {
    if (hasAccess && bot) {
        setMessages([{
            id: 'init',
            role: 'assistant',
            content: bot.welcomeMessage || "Hello! How can I help you?"
        }]);
    }
  }, [hasAccess, bot]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (tempKey.trim().length > 10) {
          setUserApiKey(tempKey.trim());
          setHasAccess(true);
      } else {
          alert("Please enter a valid API Key");
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !botId || !userApiKey) return;

    const userText = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setError('');

    try {
      const responseMessage = await sendChatMessage(botId, userText, userApiKey);
      setMessages(prev => [...prev, responseMessage]);
    } catch (err: any) {
      // If invalid key, maybe reset access?
      if (err.message.includes('Invalid Google Gemini API Key')) {
         setHasAccess(false);
         setUserApiKey('');
         alert("The API Key provided is invalid. Please try again.");
      }

      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${err.message || "I'm having trouble connecting to the server right now."}`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // 1. Loading State
  if (isLoadingBot) {
      return <div className="flex h-screen items-center justify-center bg-background"><Spinner className="w-10 h-10 text-primary"/></div>;
  }

  // 2. Error State (Bot not found)
  if (!bot) {
      return <div className="text-center mt-20 text-red-500 text-xl">{error}</div>;
  }

  // 3. Key Entry Gatekeeper (Arabic Styled as requested)
  if (!hasAccess) {
      return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-500 rounded-full p-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">محلل PDF المطور ودردشة</h2>
                <p className="text-gray-500 mb-8 text-sm">حلل ملفاتك، أجب عن أسئلتك، وحل المسائل</p>
                
                <form onSubmit={handleKeySubmit} className="space-y-4">
                    <div className="text-right">
                        <label className="text-xs text-gray-500 block mb-1 mr-1">مفتاح Gemini API</label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {/* Eye icon or generic icon */}
                             </div>
                             <input 
                                type="password" 
                                placeholder="●●●●●●●●●●●●●●●●●●●●" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                className="w-full bg-blue-50 border border-blue-100 text-gray-800 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-3 text-left placeholder-gray-400 outline-none transition-all"
                                required
                             />
                             <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                </svg>
                             </span>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-lg px-5 py-3 mr-2 mb-2 focus:outline-none transition-colors flex items-center justify-center gap-2"
                    >
                       تسجيل الدخول 
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transform rotate-180">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </form>
                
                <div className="flex justify-between items-center mt-6 text-xs text-gray-500">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        احصل على المفتاح
                    </a>
                     <a href="#" className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        كيف أحصل عليه؟
                    </a>
                </div>
            </div>
        </div>
      );
  }

  // 4. Main Chat Interface
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-surface rounded-lg shadow-2xl border border-border overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-secondary flex items-center justify-between">
        <div className="flex items-center">
             <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-lg font-bold text-text-primary">{bot.name}</h2>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary hidden md:inline-block">Key ending in ...{userApiKey.slice(-4)}</span>
            <button onClick={() => setHasAccess(false)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Exit</button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto bg-background/50">
        {messages.map(msg => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {isSending && (
          <div className="flex justify-start animate-pulse">
             <div className="px-4 py-3 rounded-xl bg-background text-text-primary rounded-bl-none border border-border flex items-center">
                <Spinner className="w-4 h-4 mr-2 text-primary" />
                <span className="text-xs text-text-secondary">Analyzing documents...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-surface">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow bg-background border border-border rounded-xl py-3 px-5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-primary text-white rounded-xl p-3 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <PaperAirplaneIcon className="w-6 h-6 transform -rotate-45 translate-x-0.5 -translate-y-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;