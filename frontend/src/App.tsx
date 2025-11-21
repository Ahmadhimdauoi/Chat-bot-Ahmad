import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/chat/:botId" element={<ChatPage />} />
            <Route path="*" element={<div className="text-center mt-10 text-gray-600">Page not found. Please use the link provided by your administrator.</div>} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;