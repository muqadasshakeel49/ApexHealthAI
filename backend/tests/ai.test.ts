import { FallbackAIService } from '../src/services/ai/FallbackAIService';
import { MistralAIService } from '../src/services/ai/MistralAIService';
import { aiOutputSchema } from '../src/validators/chat.validator';
import { ConversationMessage } from '../src/services/ai/types';

describe('AI Appointment Processing & Resiliency', () => {
  const fixedRefDate = new Date('2026-09-10T12:00:00.000Z');

  describe('FallbackAIService (Deterministic NLP Engine)', () => {
    let service: FallbackAIService;

    beforeEach(() => {
      service = new FallbackAIService();
    });

    it('should extract service and ask for date when only service is provided', async () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: 'I need to book a dental appointment.' }
      ];

      const result = await service.processAppointmentConversation(messages, fixedRefDate);

      expect(result.appointment.service).toBe('General Dental Checkup');
      expect(result.appointment.date).toBeNull();
      expect(result.appointment.time).toBeNull();
      expect(result.missingFields).toContain('date');
      expect(result.missingFields).toContain('time');
      expect(result.readyToBook).toBe(false);
      expect(result.reply.toLowerCase()).toContain('date');
    });

    it('should accumulate context across multi-turn conversation and reach readyToBook: true', async () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: 'I want an appointment.' },
        { role: 'assistant', content: 'What type of appointment would you like?' },
        { role: 'user', content: 'Dentist.' },
        { role: 'assistant', content: 'What date would work for you?' },
        { role: 'user', content: 'Tomorrow.' },
        { role: 'assistant', content: 'What time would you prefer?' },
        { role: 'user', content: '3 PM.' }
      ];

      const result = await service.processAppointmentConversation(messages, fixedRefDate);

      expect(result.appointment.service).toBe('General Dental Checkup');
      expect(result.appointment.date).toBe('2026-09-11'); // 1 day after Sept 10
      expect(result.appointment.time).toBe('15:00'); // 3 PM normalized to 15:00
      expect(result.missingFields).toEqual([]);
      expect(result.readyToBook).toBe(true);
      expect(result.reply.toLowerCase()).toContain('confirm');
    });

    it('should NOT invent dates when user input is ambiguous ("sometime soon")', async () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: 'I need something sometime soon.' }
      ];

      const result = await service.processAppointmentConversation(messages, fixedRefDate);

      expect(result.appointment.date).toBeNull();
      expect(result.appointment.time).toBeNull();
      expect(result.readyToBook).toBe(false);
      expect(result.missingFields).toContain('date');
      expect(result.reply).toContain('specific date');
    });
  });

  describe('AI Output Zod Validation Schema', () => {
    it('should validate complete appointment output schema successfully', () => {
      const validPayload = {
        reply: 'I have all the details. Would you like to confirm?',
        intent: 'BOOK_APPOINTMENT',
        appointment: {
          service: 'Dental',
          date: '2026-09-11',
          time: '15:00',
          notes: null
        },
        missingFields: [],
        readyToBook: true,
        confidence: 0.98
      };

      const parsed = aiOutputSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it('should reject malformed payload missing required reply field', () => {
      const invalidPayload = {
        intent: 'BOOK_APPOINTMENT',
        appointment: { service: 'Dental', date: null, time: null, notes: null },
        missingFields: ['date', 'time'],
        readyToBook: false
      };

      const parsed = aiOutputSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('MistralAIService Graceful Degradation', () => {
    it('should fall back gracefully to FallbackAIService when no API key is set', async () => {
      const service = new MistralAIService('', 'mistral-small-latest');
      const messages: ConversationMessage[] = [
        { role: 'user', content: 'I need a dental appointment tomorrow at 14:00' }
      ];

      const result = await service.processAppointmentConversation(messages, fixedRefDate);

      expect(result.fallbackUsed).toBe(true);
      expect(result.readyToBook).toBe(true);
      expect(result.appointment.service).toBe('General Dental Checkup');
      expect(result.appointment.time).toBe('14:00');
    });
  });
});
