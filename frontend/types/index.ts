export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  service: string;
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedAppointment {
  service: string | null;
  date: string | null;
  time: string | null;
  notes?: string | null;
}

export interface AIEvaluation {
  reply: string;
  intent: 'BOOK_APPOINTMENT' | 'GENERAL_QUERY' | 'UNKNOWN';
  appointment: ExtractedAppointment;
  missingFields: string[];
  readyToBook: boolean;
  fallbackUsed?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: {
    model?: string;
    latencyMs?: number;
    intent?: string;
    extractedAppointment?: ExtractedAppointment;
    appointment?: ExtractedAppointment;
    missingFields?: string[];
    readyToBook?: boolean;
    confidence?: number;
    fallbackUsed?: boolean;
    initialGreeting?: boolean;
  } | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
  messages?: ChatMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
