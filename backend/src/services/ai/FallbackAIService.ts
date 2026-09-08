import { AIService, ConversationMessage, AIProcessResult, ExtractedAppointment } from './types';
import logger from '../../utils/logger';

export class FallbackAIService implements AIService {
  async processAppointmentConversation(
    messages: ConversationMessage[],
    referenceDate: Date = new Date()
  ): Promise<AIProcessResult> {
    const startTime = Date.now();
    logger.info('Executing FallbackAIService deterministic parsing');

    // Aggregate conversation to infer accumulated appointment details
    let currentService: string | null = null;
    let currentDate: string | null = null;
    let currentTime: string | null = null;
    let currentNotes: string | null = null;

    // Scan all user messages in history to accumulate slots
    for (const msg of messages) {
      if (msg.role === 'user') {
        const text = msg.content.toLowerCase();

        // 1. Service extraction
        if (/dent(al|ist)|teeth|tooth|cleaning/i.test(text)) {
          currentService = 'General Dental Checkup';
        } else if (/derma(tol|tology)|skin|rash|acne/i.test(text)) {
          currentService = 'Dermatology Consultation';
        } else if (/cardio(logy)?|heart/i.test(text)) {
          currentService = 'Cardiology Consultation';
        } else if (/eye|optom|vision|glasses/i.test(text)) {
          currentService = 'Eye Examination';
        } else if (/physio|therapy|massage|back pain/i.test(text)) {
          currentService = 'Physical Therapy';
        } else if (/checkup|doctor|general|consult(ation)?/i.test(text) && !currentService) {
          currentService = 'General Health Consultation';
        }

        // 2. Date extraction (relative & absolute)
        if (/\btomorrow\b/i.test(text)) {
          const d = new Date(referenceDate);
          d.setDate(d.getDate() + 1);
          currentDate = this.formatDate(d);
        } else if (/\bin two days\b|\b2 days\b/i.test(text)) {
          const d = new Date(referenceDate);
          d.setDate(d.getDate() + 2);
          currentDate = this.formatDate(d);
        } else if (/\btoday\b/i.test(text)) {
          currentDate = this.formatDate(referenceDate);
        } else if (/\bnext week\b/i.test(text)) {
          // ambiguous next week
          currentDate = null;
        } else {
          // Check for YYYY-MM-DD
          const matchDate = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
          if (matchDate) {
            currentDate = matchDate[1];
          }
        }

        // Check for ambiguous date expressions: "sometime soon", "soon", "sometime"
        if (/\b(sometime soon|sometime|whenever|soon)\b/i.test(text)) {
          // Explicitly ambiguous
          currentDate = null;
        }

        // 3. Time extraction
        // Match expressions like "3 pm", "3:00 pm", "15:00", "around 3pm", "10 am"
        const time12Match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
        if (time12Match) {
          let hours = parseInt(time12Match[1], 10);
          const minutes = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
          const meridian = time12Match[3].toLowerCase();

          if (meridian === 'pm' && hours < 12) hours += 12;
          if (meridian === 'am' && hours === 12) hours = 0;

          currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
          const time24Match = text.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
          if (time24Match) {
            currentTime = time24Match[0];
          } else if (/\bafternoon\b/i.test(text) && !currentTime) {
            // "afternoon" alone is ambiguous without specific hour
            // Leave currentTime null so we ask for specific time
          } else if (/\bmorning\b/i.test(text) && !currentTime) {
            // "morning" alone is ambiguous
          }
        }

        // 4. Notes extraction
        const notesMatch = text.match(/(?:note|notes|reason|details?):\s*(.+)/i);
        if (notesMatch) {
          currentNotes = notesMatch[1].trim();
        }
      }
    }

    const missingFields: string[] = [];
    if (!currentService) missingFields.push('service');
    if (!currentDate) missingFields.push('date');
    if (!currentTime) missingFields.push('time');

    const appointment: ExtractedAppointment = {
      service: currentService,
      date: currentDate,
      time: currentTime,
      notes: currentNotes
    };

    const readyToBook = missingFields.length === 0;
    const lastUserMsg = messages
      .filter((m) => m.role === 'user')
      .slice(-1)[0]?.content || '';

    // Handle ambiguous vague input case
    if (/\b(sometime soon|sometime|whenever)\b/i.test(lastUserMsg)) {
      return {
        reply: "I'd be glad to help, but I need a more specific date and time. Could you share what date works best for you?",
        intent: 'BOOK_APPOINTMENT',
        appointment,
        missingFields,
        readyToBook: false,
        confidence: 0.9,
        model: 'heuristic-fallback',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true
      };
    }

    let reply = '';
    if (readyToBook) {
      reply = `Great! I have all your details for a ${currentService} on ${currentDate} at ${currentTime}. Please review the confirmation card below to book your appointment.`;
    } else if (missingFields.includes('service')) {
      reply = 'What type of appointment or service would you like to book? (For example: Dental, Dermatology, or Eye Exam)';
    } else if (missingFields.includes('date')) {
      reply = `Understood, a ${currentService}. What date would you prefer for your appointment? (e.g., tomorrow, or a specific date)`;
    } else if (missingFields.includes('time')) {
      reply = `Got it for ${currentDate}. What time would work best for you? (e.g., 10:00 AM, 3:00 PM)`;
    }

    return {
      reply,
      intent: 'BOOK_APPOINTMENT',
      appointment,
      missingFields,
      readyToBook,
      confidence: 0.85,
      model: 'heuristic-fallback',
      latencyMs: Date.now() - startTime,
      fallbackUsed: true
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default FallbackAIService;
