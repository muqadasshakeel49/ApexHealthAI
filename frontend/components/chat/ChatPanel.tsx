import React, { useState, useEffect, useRef } from 'react';
import { Bot, RefreshCw, AlertCircle, CalendarPlus, Loader2, Sparkles } from 'lucide-react';
import { ChatSession, ChatMessage as ChatMessageType, Appointment, ExtractedAppointment } from '../../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Button from '../ui/Button';
import api from '../../lib/api';

interface ChatPanelProps {
  initialSessionId?: string;
  onAppointmentBooked?: (appointment: Appointment) => void;
  onOpenFallbackForm?: (data?: Partial<ExtractedAppointment>) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  initialSessionId,
  onAppointmentBooked,
  onOpenFallbackForm
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load or initialize chat session
  useEffect(() => {
    const initSessions = async () => {
      try {
        setIsLoadingSession(true);
        setError(null);
        const existingSessions = await api.chat.listSessions();
        setSessions(existingSessions);

        if (currentSessionId) {
          await loadMessages(currentSessionId);
        } else if (existingSessions.length > 0) {
          setCurrentSessionId(existingSessions[0].id);
          await loadMessages(existingSessions[0].id);
        } else {
          // Create initial session
          const newSession = await api.chat.createSession('New Booking Session');
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
          if (newSession.messages) {
            setMessages(newSession.messages);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize AI assistant.');
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSessions();
  }, []);

  const loadMessages = async (sessionId: string) => {
    try {
      setError(null);
      const msgs = await api.chat.getMessages(sessionId);
      setMessages(msgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation history.');
    }
  };

  const handleCreateNewSession = async () => {
    try {
      setIsSending(true);
      setError(null);
      const session = await api.chat.createSession('New Booking Session');
      setSessions((prev) => [session, ...prev]);
      setCurrentSessionId(session.id);
      if (session.messages) {
        setMessages(session.messages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create new chat session.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) return;

    // Optimistically add user message to UI
    const optimisticUserMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      role: 'USER',
      content,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsSending(true);
    setError(null);

    try {
      const response = await api.chat.sendMessage(currentSessionId, content);

      // Replace optimistic message with confirmed server message and append assistant message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        response.userMessage,
        response.assistantMessage
      ]);

      // If AI failed completely or suggests fallback form, notify parent
      if (
        response.aiEvaluation.intent === 'UNKNOWN' ||
        response.assistantMessage.content.includes('continue using the appointment form')
      ) {
        // AI fallback triggered
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process message with AI assistant.');
      // Remove temporary message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="min-h-16 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-100">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
              AI Appointment Assistant
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Natural language booking & slot extraction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {onOpenFallbackForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenFallbackForm()}
              leftIcon={<CalendarPlus className="w-3.5 h-3.5 text-slate-500" />}
              className="text-xs px-2 sm:px-3"
            >
              Manual Form
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateNewSession}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs px-2 sm:px-3"
          >
            New Chat
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto space-y-4">
        {isLoadingSession ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            Loading conversation...
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onAppointmentBooked={onAppointmentBooked}
                onOpenFallbackForm={onOpenFallbackForm}
              />
            ))}

            {/* AI Thinking indicator */}
            {isSending && (
              <div className="flex items-center gap-3 animate-in fade-in duration-150">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-indigo-300 flex items-center justify-center border border-slate-700">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span>Processing your request...</span>
                </div>
              </div>
            )}

            {/* Error Banner inside chat with fallback action */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to communicate with AI Assistant</p>
                  <p className="mt-0.5 text-rose-700">{error}</p>
                  {onOpenFallbackForm && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onOpenFallbackForm()}
                        className="text-xs py-1 px-2.5"
                      >
                        Use Structured Booking Form Instead
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isSending || isLoadingSession}
        disabled={isLoadingSession}
      />
    </div>
  );
};

export default ChatPanel;
