import { MessageRole } from '@prisma/client';
import prisma from '../db/prisma';
import { getAIService, ConversationMessage } from './ai';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class ChatService {
  private aiService = getAIService();

  async createSession(userId: string, title?: string) {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || 'Appointment Assistant'
      }
    });

    // Add initial greeting from assistant
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: MessageRole.ASSISTANT,
        content:
          "Hello! I am your AI Appointment Assistant. What kind of appointment would you like to schedule? (For example: Dental, Dermatology, Cardiology, or Eye Exam)",
        metadata: {
          intent: 'GREETING',
          initialGreeting: true
        }
      }
    });

    return this.getSessionWithMessages(userId, session.id);
  }

  async getSessions(userId: string) {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    return sessions;
  }

  async getSessionWithMessages(userId: string, sessionId: string) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      throw new AppError('Chat session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.userId !== userId) {
      throw new AppError('You do not have access to this chat session', 403, 'FORBIDDEN');
    }

    return session;
  }

  async getMessages(userId: string, sessionId: string) {
    // Verify ownership
    await this.getSessionWithMessages(userId, sessionId);

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    return messages;
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.getSessionWithMessages(userId, sessionId);

    await prisma.chatSession.delete({
      where: { id: sessionId }
    });

    return { deleted: true };
  }

  async postMessage(userId: string, sessionId: string, content: string) {
    // 1. Verify session exists and belongs to user
    const session = await this.getSessionWithMessages(userId, sessionId);

    // 2. Persist USER message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content
      }
    });

    // Update session updated_at timestamp & auto-update title if it's the first user message
    if (session.messages.filter((m) => m.role === MessageRole.USER).length === 0) {
      const title = content.length > 35 ? `${content.slice(0, 32)}...` : content;
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title, updatedAt: new Date() }
      });
    } else {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });
    }

    // 3. Assemble conversation history for AI context
    const previousMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20 // Keep last 20 messages for context efficiency
    });

    const conversationHistory: ConversationMessage[] = previousMessages.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // 4. Invoke AI Service
    let aiResult;
    try {
      aiResult = await this.aiService.processAppointmentConversation(conversationHistory);
    } catch (err: any) {
      logger.error('Unhandled AI service error', { error: err.message, sessionId });
      aiResult = {
        reply: "We couldn't understand the appointment details. You can continue using the appointment form.",
        intent: 'UNKNOWN' as const,
        appointment: { service: null, date: null, time: null, notes: null },
        missingFields: ['service', 'date', 'time'],
        readyToBook: false,
        confidence: 0,
        model: 'error-fallback',
        latencyMs: 0,
        fallbackUsed: true
      };
    }

    // 5. Persist ASSISTANT message with AI metadata
    const metadata: any = {
      model: aiResult.model || 'unknown',
      latencyMs: aiResult.latencyMs || 0,
      intent: aiResult.intent,
      extractedAppointment: aiResult.appointment,
      missingFields: aiResult.missingFields,
      readyToBook: aiResult.readyToBook,
      confidence: aiResult.confidence,
      fallbackUsed: aiResult.fallbackUsed ?? false
    };

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: aiResult.reply,
        metadata
      }
    });

    // 6. Log AI telemetry
    logger.logAIEvaluation({
      sessionId,
      userId,
      model: aiResult.model || 'unknown',
      latencyMs: aiResult.latencyMs || 0,
      intent: aiResult.intent,
      readyToBook: aiResult.readyToBook,
      extractedFields: aiResult.appointment,
      success: true
    });

    return {
      userMessage,
      assistantMessage,
      aiEvaluation: {
        reply: aiResult.reply,
        intent: aiResult.intent,
        appointment: aiResult.appointment,
        missingFields: aiResult.missingFields,
        readyToBook: aiResult.readyToBook,
        fallbackUsed: aiResult.fallbackUsed
      }
    };
  }
}

export const chatService = new ChatService();
export default chatService;
