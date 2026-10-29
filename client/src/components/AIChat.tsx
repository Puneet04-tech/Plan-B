"use strict";

import { useState, useRef, useEffect } from "react";
import type { PlanBundle } from "@shared/types";
import { fetchChat } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  source?: "ai" | "fallback";
}

interface Props {
  plan?: PlanBundle | null;
  className?: string;
}

const AIChat = ({ plan, className = "" }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI event planning assistant, grounded in your current plan. Ask me about your budget, timeline, vendors, or risks.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetchChat(question, plan ?? undefined);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.reply,
          timestamp: new Date(),
          source: res.source,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I could not reach the AI service just now — please try again.",
          timestamp: new Date(),
          source: "fallback",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`ai-chat-container ${className} ${isOpen ? "open" : "closed"}`}>
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
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className={`chat-status ${plan ? "online" : "offline"}`}>
                {plan ? "● Plan connected" : "○ No plan yet"}
              </span>
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
                  {message.role === "assistant" && message.source === "fallback" && (
                    <span
                      className="chip chip-warn"
                      style={{
                        display: "inline-block",
                        marginTop: "0.25rem",
                        fontSize: "0.65rem",
                      }}
                    >
                      offline
                    </span>
                  )}
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
