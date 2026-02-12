
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { gemini } from '../services/geminiService';

interface DesignChatProps {
  currentImage: string | null;
  onRefine: (instruction: string) => void;
  isGenerating: boolean;
}

export const DesignChat: React.FC<DesignChatProps> = ({ currentImage, onRefine, isGenerating }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // If the user seems to be asking for an edit
      if (input.toLowerCase().includes('change') || input.toLowerCase().includes('make') || input.toLowerCase().includes('add') || input.toLowerCase().includes('remove')) {
        onRefine(input);
        const botMsg: ChatMessage = { role: 'model', text: "Coming right up! I'm updating your design now...", timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        await playSpeech(botMsg.text);
      } else {
        // General questions with grounding
        const response = await gemini.chatAboutDesign(input, currentImage || undefined);
        const botMsg: ChatMessage = { role: 'model', text: response.text, timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        await playSpeech(botMsg.text);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error while processing that.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const playSpeech = async (text: string) => {
    try {
      const buffer = await gemini.speakText(text.slice(0, 500)); // Limit for TTS speed
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn("Speech failed", e);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-lg border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
        </div>
        <h3 className="font-semibold text-slate-800">Design Assistant</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-10">
            <p className="text-sm">Ask me to change something or where to find furniture!</p>
            <p className="text-xs italic mt-2">"Make the rug blue" or "Where can I find a sofa like this?"</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-2 rounded-2xl flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your design feedback..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={isGenerating}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};
