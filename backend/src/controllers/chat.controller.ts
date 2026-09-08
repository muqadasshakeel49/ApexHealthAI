import { Request, Response, NextFunction } from 'express';
import chatService from '../services/chat.service';

export class ChatController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await chatService.createSession(req.user!.id, req.body.title);
      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await chatService.getSessions(req.user!.id);
      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await chatService.getSessionWithMessages(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await chatService.getMessages(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  async postMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await chatService.postMessage(
        req.user!.id,
        req.params.id,
        req.body.content
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await chatService.deleteSession(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
export default chatController;
