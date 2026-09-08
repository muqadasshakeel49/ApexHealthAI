import React, { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const SUGGESTIONS = [
  'I need a dental appointment tomorrow at 3 PM.',
  'Book a cardiology consultation next Friday at 10:00 AM.',
  'I need something sometime soon.' // Ambiguity test case
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled
}) => {
  const [content, setContent] = useState('');

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || disabled) return;
    setContent('');
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200 space-y-3">
      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0 text-[11px]">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Try:
        </span>
        {SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading || disabled}
            onClick={() => setContent(suggestion)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/80 transition-colors text-[11px] disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Composer Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder={
            isLoading
              ? 'AI Assistant is thinking...'
              : 'Type your appointment request (e.g. "Dentist tomorrow afternoon")...'
          }
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!content.trim() || isLoading || disabled}
          isLoading={isLoading}
          className="rounded-xl px-4 py-2.5 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
