// components/FieldChat.tsx
'use client';

import React, { useState } from 'react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface FieldChatProps {
  fieldId: string;
}

export default function FieldChat({ fieldId }: FieldChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Salut! Sunt Copilotul tău AI. Pune-mi orice întrebare despre recomandările de astăzi sau despre starea culturii tale!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          fieldId,
          chatHistory: messages.slice(1) // Trimitem istoricul (fără mesajul de întâmpinare)
        })
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Scuze, am întâmpinat o eroare la procesare.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Nu am putut contacta serverul.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm flex flex-col h-[500px]">
      {/* Header Chat */}
      <div className="p-4 border-b bg-emerald-50 flex items-center space-x-2 rounded-t-xl">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="font-bold text-emerald-950 text-sm">AI Farm Copilot Chat</h3>
          <p className="text-xs text-emerald-700 font-medium">Asistență bazată pe datele câmpului tău</p>
        </div>
      </div>

      {/* Mesaje */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
              msg.sender === 'user' 
                ? 'bg-emerald-700 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-lg rounded-bl-none px-4 py-2.5 text-sm animate-pulse">
              Copilotul se gândește...
            </div>
          </div>
        )}
      </div>

      {/* Input de trimitere */}
      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 bg-gray-50 rounded-b-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Întreabă AI-ul (ex: De ce e închisă fereastra de stropire?)"
          className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          disabled={loading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition"
          disabled={loading}
        >
          Trimite
        </button>
      </form>
    </div>
  );
}
