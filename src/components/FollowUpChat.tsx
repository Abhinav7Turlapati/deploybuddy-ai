import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DiagnosticResult } from '../types/diagnosis';
import { Send, Bot, User, Sparkles, MessageSquare, HelpCircle, Loader2 } from 'lucide-react';

interface FollowUpChatProps {
  diagnosis: DiagnosticResult | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isSending: boolean;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  diagnosis,
  messages,
  onSendMessage,
  isSending
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isSending) return;
    onSendMessage(prompt);
  };

  const defaultPrompts = [
    "Explain this like I'm 5 🐣",
    "What if this happens in production? 🚀",
    "I got 'permission denied' when running the command 🔒",
    diagnosis?.category === 'spring-boot'
      ? "How do I run on a different port instead? 🔄"
      : "How can I prevent this from ever happening again in CI? 🛡️"
  ];

  // Helper to render simple markdown with bold, code blocks and lists
  const renderFormattedText = (content: string) => {
    const parts = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {parts.map((line, i) => {
          if (line.startsWith('```')) {
            return null; // Handle code blocks simply
          }
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={i} className="flex items-start space-x-2 pl-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{renderInlineStyles(line.slice(2))}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)?.[1];
            const text = line.replace(/^\d+\.\s/, '');
            return (
              <div key={i} className="flex items-start space-x-2 pl-2">
                <span className="text-blue-400 font-bold">{num}.</span>
                <span>{renderInlineStyles(text)}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={i} className="h-1" />;
          }
          return <p key={i}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    // Quick regex for bold **text** and inline `code`
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 mx-0.5 bg-slate-900 border border-slate-700/80 rounded text-blue-300 font-mono text-xs">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div id="follow-up-chat" className="bg-[#101728] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden mt-6">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1424] to-[#111a30] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                DeployBuddy Follow-Up Mentor
              </h3>
              <span className="flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {diagnosis
                ? `Ready to clarify "${diagnosis.title}" or answer your next question`
                : 'Ask any questions about debugging, deployment, Docker, K8s, or CI/CD'}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-4 py-3 bg-[#0c1220] border-b border-slate-800/60 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          <span className="text-[11px] font-medium text-slate-400 flex items-center shrink-0">
            <Sparkles className="w-3 h-3 text-blue-400 mr-1" />
            Suggested Questions:
          </span>
          {defaultPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-2.5 py-1 rounded-full text-xs bg-slate-800/80 hover:bg-blue-900/40 text-slate-300 hover:text-blue-200 border border-slate-700/60 hover:border-blue-500/40 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 sm:p-5 max-h-[420px] min-h-[220px] overflow-y-auto space-y-4 bg-[#0a0f1c]/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white border-blue-400/40'
                  : 'bg-slate-800 text-blue-400 border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-slate-200 shadow-sm border ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white border-blue-500/50 rounded-tr-none'
                  : 'bg-[#101729] border-slate-800 rounded-tl-none'
              }`}
            >
              {renderFormattedText(msg.content)}
              <div
                className={`text-[10px] mt-1.5 flex justify-end ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#101729] border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-slate-300 text-xs flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span>DeployBuddy is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 bg-[#0d1424] border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question (e.g. 'Can you explain step 2 in more detail?')..."
          className="flex-1 bg-[#090d18] text-slate-200 placeholder:text-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-700/80 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className={`p-2.5 rounded-lg text-white font-medium transition-all cursor-pointer ${
            !input.trim() || isSending
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 border border-blue-400/40'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
