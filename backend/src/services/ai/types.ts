export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ExtractedAppointment {
  service: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  notes: string | null;
}

export interface AIProcessResult {
  reply: string;
  intent: 'BOOK_APPOINTMENT' | 'GENERAL_QUERY' | 'UNKNOWN';
  appointment: ExtractedAppointment;
  missingFields: string[];
  readyToBook: boolean;
  confidence?: number;
  model?: string;
  latencyMs?: number;
  fallbackUsed?: boolean;
}

export interface AIService {
  processAppointmentConversation(
    messages: ConversationMessage[],
    referenceDate?: Date
  ): Promise<AIProcessResult>;
}
