import React from 'react';
import { Bot, User as UserIcon, Zap, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType, ExtractedAppointment, Appointment } from '../../types';
import BookingConfirmationCard from './BookingConfirmationCard';

interface ChatMessageProps {
  message: ChatMessageType;
  onAppointmentBooked?: (appointment: Appointment) => void;
  onOpenFallbackForm?: (data: Partial<ExtractedAppointment>) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onAppointmentBooked,
  onOpenFallbackForm
}) => {
  const isUser = message.role === 'USER';
  const metadata = message.metadata;

  const extracted = metadata?.extractedAppointment || metadata?.appointment;
  const isReadyToBook = Boolean(metadata?.readyToBook && extracted);

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } group animate-in fade-in duration-200`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-tr from-slate-900 to-indigo-950 text-indigo-300 border border-slate-700'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`min-w-0 max-w-[calc(100%-2.75rem)] sm:max-w-[75%] space-y-1.5`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-100'
              : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* If ready to book, render inline confirmation card */}
          {!isUser && isReadyToBook && extracted && (
            <BookingConfirmationCard
              appointment={extracted}
              onConfirmed={onAppointmentBooked}
              onOpenFallbackForm={onOpenFallbackForm}
            />
          )}
        </div>

        {/* Timestamp & Metadata Footer */}
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[10px] text-slate-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>

          {!isUser && metadata && (
            <>
              {metadata.model && (
                <span className="inline-flex items-center gap-1 font-mono text-slate-400">
                  • {metadata.model}
                </span>
              )}
              {metadata.latencyMs ? (
                <span className="inline-flex items-center gap-0.5 text-slate-400">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  {metadata.latencyMs}ms
                </span>
              ) : null}
              {metadata.fallbackUsed && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                  Rule-based fallback
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
