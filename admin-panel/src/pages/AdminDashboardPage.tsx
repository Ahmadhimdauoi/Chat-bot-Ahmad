import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBot, listBots, uploadFile, deleteBot } from '../services/adminApiService';
import Spinner from '../components/Spinner';
import ClipboardIcon from '../components/icons/ClipboardIcon';
import PlusIcon from '../components/icons/PlusIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ChatBubbleIcon from '../components/icons/ChatBubbleIcon';
import TrashIcon from '../components/icons/TrashIcon';

interface Document {
    _id: string;
    file_name: string;
    file_path: string;
}

interface Bot {
  _id: string;
  name: string;
  welcomeMessage: string;
  documents: Document[]; // Documents are now aggregated from backend
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
      // Ensure structure matches Bot interface
      onBotCreated({ ...newBot, documents: [] });
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
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-primary"
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
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 px-4 rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Spinner /> : 'Create Bot'}
        </button>
      </form>
    </div>
  );
};

const BotCard: React.FC<{ bot: Bot, onFileUploaded: (botId: string) => void, onDelete: (botId: string) => void }> = ({ bot, onFileUploaded, onDelete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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
                onFileUploaded(bot._id); // Refresh list
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err: any) {
                setUploadError(err.message);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${bot.name}"? This will delete all uploaded files associated with it.`)) {
            setIsDeleting(true);
            try {
                await deleteBot(bot._id);
                onDelete(bot._id);
            } catch (err: any) {
                alert("Failed to delete bot: " + err.message);
                setIsDeleting(false);
            }
        }
    };
    
    const chatLink = `http://localhost:5173/#/chat/${bot._id}`;

    return (
        <div className="bg-gray-800 p-5 rounded-lg shadow-md space-y-4 border border-gray-700 flex flex-col h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-primary truncate mr-2">{bot.name}</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => window.open(chatLink, '_blank', 'noopener,noreferrer')}
                        className="flex items-center flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors"
                    >
                        <ChatBubbleIcon className="w-4 h-4 mr-2" />
                        Open Chat
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-red-400 bg-red-400/10 rounded-md hover:bg-red-400/20 transition-colors"
                        title="Delete Bot"
                    >
                        {isDeleting ? <Spinner className="w-4 h-4 text-red-400" /> : <TrashIcon className="w-4 h-4" />}
                    </button>
                </div>
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

            <div className="border-t border-gray-700 pt-4 flex-grow">
                <h4 className="font-semibold text-gray-300 mb-2 text-sm">Knowledge Base (Files)</h4>
                
                {/* List of Uploaded Files */}
                <div className="mb-4 space-y-2">
                    {bot.documents && bot.documents.length > 0 ? (
                        <ul className="space-y-1">
                            {bot.documents.map((doc) => (
                                <li key={doc._id} className="flex items-center text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-2 text-primary">
                                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">{doc.file_name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-500 italic">No files uploaded yet.</p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <label className="flex-grow cursor-pointer bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-400 text-sm hover:border-primary flex justify-between items-center">
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
                    {isUploading && <Spinner className="w-5 h-5 text-primary"/>}
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

  const handleBotDeleted = (botId: string) => {
    setBots(prev => prev.filter(b => b._id !== botId));
  };

  // Trigger a refresh when a file is uploaded to show the new filename immediately
  const handleFileUploaded = () => {
    fetchBots(); 
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
              {bots.map(bot => (
                <BotCard 
                    key={bot._id} 
                    bot={bot} 
                    onFileUploaded={handleFileUploaded}
                    onDelete={handleBotDeleted}
                />
               ))}
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