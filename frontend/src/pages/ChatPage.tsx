import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
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
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-6 animate-slide-in group`}>
      {/* Avatar for Assistant */}
      {isAssistant && (
        <div className="flex-shrink-0 ml-3 mt-1 hidden md:block">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.718 6.163.193.681-.24 2.419-.365 3.48z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`relative max-w-[95%] md:max-w-3xl px-6 py-5 rounded-2xl text-sm md:text-base shadow-sm font-cairo leading-relaxed transition-all duration-200 hover:shadow-md ${
          isAssistant
            ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tr-none border border-gray-100 dark:border-gray-700/50'
            : 'bg-gradient-to-br from-primary to-orange-600 text-white rounded-tl-none shadow-orange-500/20'
        }`}
      >
        {isAssistant ? (
          <div className="markdown-content" dir="auto">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-primary mt-6 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-5 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 text-gray-700 dark:text-gray-300 leading-7" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 marker:text-primary mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 marker:text-primary mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-r-4 border-primary bg-gray-50 dark:bg-gray-900/50 p-3 my-4 rounded-l-lg text-gray-600 dark:text-gray-400 italic" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline decoration-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                code: ({node, inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline ? (
                    <div className="relative my-4 group/code" dir="ltr">
                        <div className="absolute right-2 top-2 text-[10px] uppercase text-gray-400 bg-gray-800/50 px-2 py-1 rounded opacity-0 group-hover/code:opacity-100 transition-opacity">{match ? match[1] : 'Code'}</div>
                        <pre className="bg-[#1e1e1e] text-gray-200 p-4 rounded-xl overflow-x-auto border border-gray-700 shadow-lg font-mono text-sm leading-relaxed">
                            <code className={className} {...props}>
                                {children}
                            </code>
                        </pre>
                    </div>
                    ) : (
                    <code className="bg-gray-100 dark:bg-gray-700 text-primary dark:text-orange-300 px-1.5 py-0.5 rounded-md text-sm font-mono border border-gray-200 dark:border-gray-600 mx-1" {...props}>
                        {children}
                    </code>
                    )
                },
                // STYLE FOR TABLES
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-md">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border-collapse" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" {...props} />,
                tbody: ({node, ...props}) => <tbody className="bg-white dark:bg-gray-900/80 divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
                tr: ({node, ...props}) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wider border-l border-gray-300 dark:border-gray-700 last:border-l-0 whitespace-nowrap bg-gray-200/50 dark:bg-gray-700/50" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-normal break-words border-l border-gray-200 dark:border-gray-700 last:border-l-0 align-top" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                hr: ({node, ...props}) => <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />,
              }}
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
                            placeholder="أدخل Gemini API Key..." 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:outline-none transition-colors text-right bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            required
                        />
                         <div className="mt-2 flex justify-between text-xs">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:text-orange-600 underline">
                                احصل على المفتاح من هنا
                            </a>
                         </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isRegistering}
                        className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                    >
                       {isRegistering ? <Spinner className="w-6 h-6 text-white" /> : (
                           <>
                            <span>بدء المحادثة</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                           </>
                       )}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // 4. Main Chat Interface
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Chat Header */}
      <div className="h-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center">
             <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white dark:border-gray-800"></div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-lg">
                    {bot.name.charAt(0).toUpperCase()}
                </div>
             </div>
            <div className="mr-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white font-cairo">{bot.name}</h2>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1 animate-pulse"></span>
                    متصل الآن
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-yellow-400 transition-colors">
                {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
            </button>
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{username}</span>
                <span className="text-[10px] text-gray-400 font-mono">API Key: ••••{userApiKey.slice(-4)}</span>
            </div>
            <button 
                onClick={handleLogout} 
                className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-bold"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline">خروج</span>
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed dark:invert-[0.05]">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        
        {isSending && (
          <div className="flex justify-start animate-slide-in">
             <div className="ml-3 mt-1 hidden md:block w-8 h-8"></div> {/* Spacer */}
             <div className="px-6 py-4 rounded-2xl rounded-tr-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-3">
                <div className="flex space-x-1 space-x-reverse">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">جاري الكتابة...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-lg z-20">
        <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="flex-grow w-full bg-gray-100 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 rounded-2xl py-4 pr-6 pl-14 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-primary focus:ring-0 focus:outline-none transition-all shadow-inner font-cairo text-base"
                dir="auto"
            />
            
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                    {isSending ? (
                         <Spinner className="w-5 h-5 text-white" />
                    ) : (
                        <PaperAirplaneIcon className="w-5 h-5 transform rotate-180" />
                    )}
                </button>
            </div>
            </form>
            <div className="text-center mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-cairo">
                قد يرتكب الذكاء الاصطناعي أخطاء. يرجى التحقق من المعلومات الهامة.
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;