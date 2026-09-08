import { Request, Response, NextFunction } from 'express';
import appointmentService from '../services/appointment.service';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentController {
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, from, to } = req.query;
      const appointments = await appointmentService.getAppointments(req.user!.id, {
        status: status as AppointmentStatus | undefined,
        from: from as string | undefined,
        to: to as string | undefined
      });

      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.getAppointmentById(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const appointment = await appointmentService.updateAppointmentStatus(
        req.user!.id,
        req.params.id,
        status as AppointmentStatus
      );

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await appointmentService.validateAppointment(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
export default appointmentController;
