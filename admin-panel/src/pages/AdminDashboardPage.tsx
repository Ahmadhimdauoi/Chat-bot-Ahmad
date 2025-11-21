import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBot, listBots, uploadFile } from '../services/adminApiService';
import Spinner from '../components/Spinner';
import ClipboardIcon from '../components/icons/ClipboardIcon';
import PlusIcon from '../components/icons/PlusIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ChatBubbleIcon from '../components/icons/ChatBubbleIcon';

// Types defined locally
interface Bot {
  _id: string;
  name: string;
  welcomeMessage: string;
}

const CreateBotForm: React.FC<{ onBotCreated: (bot: Bot) => void }> = ({ onBotCreated }) => {
  const [name, setName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Bot Name is required.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const newBot = await createBot(name, welcomeMessage);
      onBotCreated(newBot);
      setName('');
      setWelcomeMessage('Hello! How can I help you today?');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
        <PlusIcon className="w-6 h-6 mr-2"/>
        Create New Chatbot
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Bot Name</label>
          <input
            type="text"
            placeholder="e.g. HR Assistant"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Welcome Message</label>
          <input
            type="text"
            placeholder="Welcome message for users..."
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Spinner /> : 'Create Bot'}
        </button>
      </form>
    </div>
  );
};

const BotCard: React.FC<{ bot: Bot }> = ({ bot }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
              setUploadError('Only PDF files are allowed.');
              return;
            }
            
            setIsUploading(true);
            setUploadError('');
            setUploadSuccess('');
            
            try {
                await uploadFile(bot._id, file);
                setUploadSuccess('PDF processed & added to KB!');
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err: any) {
                setUploadError(err.message);
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    // Pointing to the Frontend Chat App Port (Assuming 5173)
    const chatLink = `http://localhost:5173/#/chat/${bot._id}`;

    return (
        <div className="bg-gray-800 p-5 rounded-lg shadow-md space-y-4 border border-gray-700">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-indigo-400 truncate mr-2">{bot.name}</h3>
                <button
                    onClick={() => window.open(chatLink, '_blank', 'noopener,noreferrer')}
                    className="flex items-center flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition-colors"
                >
                    <ChatBubbleIcon className="w-4 h-4 mr-2" />
                    Open Chat
                </button>
            </div>
            
            <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                    <input type="text" readOnly value={chatLink} className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-xs" />
                    <button onClick={() => handleCopy(chatLink)} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 relative">
                        <ClipboardIcon className="w-4 h-4 text-white"/>
                        {copySuccess && <span className="absolute -top-7 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-md">{copySuccess}</span>}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-300 mb-2 text-sm">Knowledge Base (PDF)</h4>
                <div className="flex items-center space-x-2">
                    <label className="flex-grow cursor-pointer bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-400 text-sm hover:border-indigo-500 flex justify-between items-center">
                        <span>Upload PDF</span>
                        <UploadIcon className="w-4 h-4"/>
                        <input 
                          type="file" 
                          accept="application/pdf" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileChange} 
                          disabled={isUploading}
                        />
                    </label>
                    {isUploading && <Spinner className="w-5 h-5 text-indigo-500"/>}
                </div>
                 {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
                 {uploadSuccess && <p className="text-green-500 text-xs mt-2">{uploadSuccess}</p>}
            </div>
        </div>
    );
}

const AdminDashboardPage: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  const fetchBots = useCallback(async () => {
    try {
      const fetchedBots = await listBots();
      setBots(fetchedBots);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bots. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        fetchBots();
    }
  }, [isAuthenticated, fetchBots]);

  const handleBotCreated = (newBot: Bot) => {
    setBots(prev => [newBot, ...prev]);
  };

  return (
    <div>
      <CreateBotForm onBotCreated={handleBotCreated} />
      
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">Your Chatbots</h2>
        {isLoading && <div className="flex justify-center mt-8"><Spinner className="w-8 h-8"/></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!isLoading && !error && (
          bots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map(bot => <BotCard key={bot._id} bot={bot} />)}
            </div>
          ) : (
            <p className="text-center text-gray-400 mt-8">No chatbots created yet.</p>
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;