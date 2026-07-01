import React, { useState, useEffect, useRef } from 'react';
import { AiFillEye, AiOutlineClose } from 'react-icons/ai'; // Adjust icon imports as per your project

const AIBot = ({ reportData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize chat with the specified welcome message from the bot
  useEffect(() => {
    const welcomeMessage = "Hi! I can answer questions about this report. Try asking: 'What was the best performing month?' or 'Summarise the main risks.'";
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ask-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          reportData, // Pass the report data prop
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer from AI');
      }

      setMessages([...messages, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error('[AIBot] Error:', err);
      setMessages([...messages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // If opening, focus the input after a short delay
    if (isOpen) {
      setTimeout(() => {
        const inputRef = document.getElementById('ai-bot-input');
        if (inputRef) inputRef.focus();
      }, 100);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle AI chat"
      >
        {isOpen ? <AiOutlineClose size={20} /> : <AiFillEye size={20} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                <AiFillEye size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Ask the data</h3>
                <p className="text-xs text-gray-500">Get instant insights from your report</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close chat"
            >
              <AiOutlineClose size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white self-end'
                      : 'bg-gray-100 text-gray-800 self-start'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[70%] px-3 py-2 rounded-lg bg-gray-100 text-gray-500 italic self-start">
                  Thinking<span role="img" aria-label="loading">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex p-4 border-t border-gray-200 bg-white">
            <input
              id="ai-bot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the data..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIBot;