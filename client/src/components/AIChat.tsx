"use strict";

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  planData?: any;
  className?: string;
}

const AIChat = ({ planData, className = '' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI event planning assistant. Ask me anything about your event - budget optimization, vendor recommendations, timeline suggestions, or anything else!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (in production, this would call the actual AI endpoint)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input, planData),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput: string, data: any): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('budget') || lowerInput.includes('cost')) {
      return `Based on your budget of ₹${data?.budget || 'pending'}, I recommend allocating 40% to venue, 25% to catering, 15% to decor, 10% to entertainment, and 10% to miscellaneous. Would you like me to suggest specific cost-saving measures?`;
    }

    if (lowerInput.includes('vendor') || lowerInput.includes('supplier')) {
      return `I can help you find the best vendors! For ${data?.city || 'your city'}, I recommend checking local vendor directories with verified reviews. Key categories to prioritize: catering, photography, and florists. Should I generate a vendor checklist for you?`;
    }

    if (lowerInput.includes('timeline') || lowerInput.includes('schedule')) {
      return `For optimal planning, start with venue booking 6 months in advance, then vendors 4-6 months before, invitations 2-3 months before, and final confirmations 2 weeks before. Would you like a detailed timeline based on your event date?`;
    }

    if (lowerInput.includes('weather') || lowerInput.includes('rain')) {
      return `I recommend having a contingency plan for weather! Consider indoor backup options, tent rentals, or choose venues with both indoor and outdoor spaces. Weather insurance is also worth considering for outdoor events.`;
    }

    if (lowerInput.includes('guest') || lowerInput.includes('invite')) {
      return `For ${data?.guests || 'your guest count'}, plan for 10-15% buffer for unexpected RSVPs. Send save-the-dates 6 months out, formal invitations 2-3 months before, and follow up 1 month before the event. Need help with guest management?`;
    }

    return `That's a great question! Based on your event details, I can provide personalized recommendations. Could you tell me more about what specific aspect you'd like to focus on - budget, vendors, timeline, or something else?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`ai-chat-container ${className} ${isOpen ? 'open' : 'closed'}`}>
      {!isOpen && (
        <button
          className="ai-chat-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat"
          title="Open AI Chat Assistant"
        >
          <span className="fab-icon">✨</span>
        </button>
      )}

      {isOpen && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h3>AI Planning Assistant</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="chat-status online">● Online</span>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  <p>{message.content}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about budget, vendors, timeline..."
              rows={4}
              className="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="btn btn-primary chat-send-btn"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
