
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { sendChatMessage, getBot, fetchChatHistory, registerUser } from '../services/apiService';
import Spinner from '../components/Spinner';
import PaperAirplaneIcon from '../components/icons/PaperAirplaneIcon';
import SunIcon from '../components/icons/SunIcon';
import MoonIcon from '../components/icons/MoonIcon';
import 'katex/dist/katex.min.css';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Bot {
  _id: string;
  name: string;
  welcomeMessage: string;
}

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4 animate-slide-in`}>
      <div
        className={`max-w-[90%] md:max-w-2xl px-5 py-4 rounded-2xl text-sm md:text-base shadow-lg backdrop-blur-sm font-cairo ${
          isAssistant
            ? 'bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-gray-100 rounded-br-none border-r-4 border-primary shadow-sm border border-gray-100 dark:border-gray-700'
            : 'bg-gradient-to-br from-primary to-orange-600 text-white rounded-bl-none'
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 prose-headings:text-primary prose-strong:text-primary prose-a:text-primary hover:prose-a:text-primary-hover prose-code:text-primary prose-code:bg-orange-50 dark:prose-code:bg-gray-700 dark:prose-code:text-orange-300 prose-code:px-1 prose-code:rounded prose-p:leading-relaxed" dir="auto">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed font-medium" dir="auto">{message.content}</p>
        )}
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();

  const [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth State
  const [username, setUsername] = useState('');
  const [userApiKey, setUserApiKey] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Apply Theme
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
      setIsDarkMode(!isDarkMode);
  };

  // Check for existing key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const storedUser = localStorage.getItem('chat_username');
    if (storedKey && storedUser) {
      setUserApiKey(storedKey);
      setTempKey(storedKey);
      setUsername(storedUser);
      setHasAccess(true);
    }
  }, []);

  // Initial Load of Bot details
  useEffect(() => {
    const loadBot = async () => {
        if (!botId) return;
        try {
            const botData = await getBot(botId);
            setBot(botData);
        } catch (err: any) {
            setError("لم يتم العثور على المجموعة أو تم حذفها.");
        } finally {
            setIsLoadingBot(false);
        }
    };
    loadBot();
  }, [botId]);

  // Initialize Chat messages (History or Welcome) after access is granted
  useEffect(() => {
    const initChat = async () => {
        if (hasAccess && bot && userApiKey) {
            try {
                const history = await fetchChatHistory(botId!, userApiKey);
                if (history && history.length > 0) {
                    setMessages(history);
                } else {
                    setMessages([{
                        id: 'init',
                        role: 'assistant',
                        content: bot.welcomeMessage || "مرحباً بك! كيف يمكنني مساعدتك اليوم؟"
                    }]);
                }
            } catch (e) {
                // Fallback if history fails
                setMessages([{
                    id: 'init',
                    role: 'assistant',
                    content: bot.welcomeMessage || "مرحباً بك! كيف يمكنني مساعدتك اليوم؟"
                }]);
            }
        }
    };
    initChat();
  }, [hasAccess, bot, userApiKey, botId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim()) {
          alert("يرجى إدخال اسم المستخدم");
          return;
      }
      if (tempKey.trim().length < 10) {
          alert("يرجى إدخال مفتاح API صالح");
          return;
      }

      setIsRegistering(true);
      try {
          // Register User in Backend
          await registerUser(username.trim(), tempKey.trim());

          const cleanKey = tempKey.trim();
          setUserApiKey(cleanKey);
          setHasAccess(true);
          localStorage.setItem('gemini_api_key', cleanKey);
          localStorage.setItem('chat_username', username.trim());
      } catch (err: any) {
          alert("فشل تسجيل الدخول: " + err.message);
      } finally {
          setIsRegistering(false);
      }
  };

  const handleLogout = () => {
    setHasAccess(false);
    setUserApiKey('');
    setTempKey('');
    setUsername('');
    setMessages([]);
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('chat_username');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !botId || !userApiKey) return;

    const userText = input;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setError('');

    try {
      const responseMessage = await sendChatMessage(botId, userText, userApiKey);
      setMessages(prev => [...prev, responseMessage]);
    } catch (err: any) {
      // If invalid key, reset access
      if (err.message && err.message.includes('Invalid Google Gemini API Key')) {
         handleLogout();
         alert("مفتاح API غير صالح. يرجى التحقق والمحاولة مرة أخرى.");
      }

      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**خطأ:** ${err.message || "حدث خطأ أثناء الاتصال بالخادم."}`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // 1. Loading State
  if (isLoadingBot) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                     <Spinner className="w-8 h-8 text-primary"/>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold font-cairo">جاري التحميل...</p>
            </div>
        </div>
      );
  }

  // 2. Error State (Bot not found)
  if (!bot) {
      return <div className="text-center mt-20 text-red-500 text-xl font-bold font-cairo">{error}</div>;
  }

  // 3. Key Entry Gatekeeper (Login Page)
  if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 font-cairo bg-gray-100 dark:bg-gray-900 transition-colors duration-300" dir="rtl">
             {/* Theme Toggle Absolute */}
             <button onClick={toggleTheme} className="absolute top-4 left-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-yellow-400 transition-colors z-50">
                {isDarkMode ? <SunIcon className="w-6 h-6"/> : <MoonIcon className="w-6 h-6"/>}
             </button>

            <div className="bg-white/80 dark:bg-gray-800/95 backdrop-blur-md p-8 sm:p-12 rounded-3xl w-full max-w-md transform transition-all hover:scale-[1.01] border border-primary/10 dark:border-gray-700 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تسجيل الدخول</h1>
                    <p className="text-gray-600 dark:text-gray-300">مرحباً بك في <strong>{bot.name}</strong>. يرجى إدخال بياناتك للمتابعة.</p>
                </div>
                
                <form onSubmit={handleKeySubmit} className="space-y-5 text-right">
                    <div className="relative">
                         <label htmlFor="username-input" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">اسم المستخدم</label>
                        <input 
                            id="username-input"
                            type="text" 
                            placeholder="أدخل اسمك..." 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none transition-colors text-right bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            required
                        />
                    </div>
                    
                    <div className="relative">
                         <label htmlFor="api-key-input" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">مفتاح API</label>
                        <input 
                            id="api-key-input"
                            type="password" 
                            placeholder="أدخل المفتاح هنا..." 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none transition-colors text-left bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            dir="ltr"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={isRegistering}
                        className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-700 text-white font-bold rounded-xl text-lg px-6 py-4 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                       {isRegistering ? (
                           <Spinner className="w-6 h-6" />
                       ) : (
                           <>
                               <span>دخول</span>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                           </>
                       )}
                    </button>
                </form>
                 <div className="mt-6 flex justify-center gap-4 text-sm">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-hover font-semibold bg-orange-50 dark:bg-gray-700 dark:text-orange-300 px-4 py-2 rounded-lg transition-colors">
                        احصل على مفتاح
                    </a>
                </div>
            </div>
        </div>
      );
  }

  // 4. Main Chat Interface
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white/60 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl rounded-3xl overflow-hidden font-cairo mt-4 md:mt-8 transition-colors duration-300">
      {/* Chat Header */}
      <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-900/60 flex items-center justify-between backdrop-blur-sm z-10" dir="rtl">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
             </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{bot.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400 font-semibold">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        متصل الآن
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">| {username}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
            </button>
            <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700 bg-red-50/80 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2 rounded-xl transition-colors border border-red-100 dark:border-red-900/30">
                خروج
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/50 scroll-smooth">
        {messages.map(msg => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {isSending && (
          <div className="flex justify-start animate-slide-in mb-4">
             <div className="px-5 py-4 rounded-2xl bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 rounded-br-none border border-gray-100 dark:border-gray-700 flex items-center shadow-sm gap-3">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm font-medium">جاري المعالجة...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-md" dir="rtl">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسأل عن محتوى الملف..."
            className="flex-grow bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary rounded-2xl py-3 px-6 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-lg focus:outline-none transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-gradient-to-r from-primary to-orange-600 text-white rounded-2xl p-4 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            <PaperAirplaneIcon className="w-6 h-6 rtl:rotate-180 transform rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
