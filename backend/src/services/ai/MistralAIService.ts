import { AIService, ConversationMessage, AIProcessResult } from './types';
import { buildSystemPrompt } from './prompt';
import { aiOutputSchema } from '../../validators/chat.validator';
import { FallbackAIService } from './FallbackAIService';
import logger from '../../utils/logger';
import config from '../../config';

export class MistralAIService implements AIService {
  private apiKey: string;
  private model: string;
  private fallbackService: FallbackAIService;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || config.mistral.apiKey;
    this.model = model || config.mistral.model;
    this.fallbackService = new FallbackAIService();
  }

  async processAppointmentConversation(
    messages: ConversationMessage[],
    referenceDate: Date = new Date()
  ): Promise<AIProcessResult> {
    if (!this.apiKey) {
      logger.info('Mistral API key not configured, redirecting to FallbackAIService');
      return this.fallbackService.processAppointmentConversation(messages, referenceDate);
    }

    const startTime = Date.now();
    const systemPrompt = buildSystemPrompt(referenceDate);

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 600
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(`Mistral API HTTP ${response.status}: ${errText}. Triggering fallback.`);
        return this.fallbackService.processAppointmentConversation(messages, referenceDate);
      }

      const data: any = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        logger.warn('Mistral API returned empty choices. Triggering fallback.');
        return this.fallbackService.processAppointmentConversation(messages, referenceDate);
      }

      // Parse JSON
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawContent);
      } catch (jsonErr) {
        logger.warn('Failed to parse Mistral JSON response. Triggering fallback.');
        return this.fallbackService.processAppointmentConversation(messages, referenceDate);
      }

      // Validate with Zod
      const validated = aiOutputSchema.safeParse(parsedJson);
      if (!validated.success) {
        logger.warn('Mistral JSON failed Zod schema validation', {
          errors: validated.error.errors
        });
        return this.fallbackService.processAppointmentConversation(messages, referenceDate);
      }

      const latencyMs = Date.now() - startTime;
      const result = validated.data;

      return {
        reply: result.reply,
        intent: result.intent,
        appointment: {
          service: result.appointment.service,
          date: result.appointment.date,
          time: result.appointment.time,
          notes: result.appointment.notes
        },
        missingFields: result.missingFields,
        readyToBook: result.readyToBook,
        confidence: result.confidence ?? 0.95,
        model: this.model,
        latencyMs,
        fallbackUsed: false
      };
    } catch (error: any) {
      logger.error('Error during Mistral API call, engaging graceful fallback', {
        error: error.message
      });
      return this.fallbackService.processAppointmentConversation(messages, referenceDate);
    }
  }
}

export default MistralAIService;
