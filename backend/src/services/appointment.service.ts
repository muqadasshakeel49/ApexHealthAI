import { AppointmentStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { CreateAppointmentInput } from '../validators/appointment.validator';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AppointmentService {
  async createAppointment(userId: string, data: CreateAppointmentInput) {
    // 1. Validate date is not in the past
    const appointmentDateObj = new Date(`${data.appointmentDate}T00:00:00.000Z`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(`${data.appointmentDate}T00:00:00`);
    if (checkDate < today) {
      throw new AppError('Cannot schedule appointments for past dates', 400, 'INVALID_DATE');
    }

    // 2. Conflict Check: check if user already has an active appointment at this date & time
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        userId,
        appointmentDate: appointmentDateObj,
        appointmentTime: data.appointmentTime,
        status: {
          not: AppointmentStatus.CANCELLED
        }
      }
    });

    if (existingAppointment) {
      throw new AppError(
        `You already have an active appointment scheduled on ${data.appointmentDate} at ${data.appointmentTime}`,
        409,
        'APPOINTMENT_CONFLICT',
        {
          conflictDate: data.appointmentDate,
          conflictTime: data.appointmentTime,
          existingAppointmentId: existingAppointment.id
        }
      );
    }

    // 3. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        service: data.service,
        appointmentDate: appointmentDateObj,
        appointmentTime: data.appointmentTime,
        status: AppointmentStatus.CONFIRMED,
        notes: data.notes || null
      }
    });

    logger.info('Appointment created successfully', {
      appointmentId: appointment.id,
      userId,
      service: appointment.service,
      date: data.appointmentDate,
      time: data.appointmentTime
    });

    return appointment;
  }

  async getAppointments(
    userId: string,
    filters?: { status?: AppointmentStatus; from?: string; to?: string }
  ) {
    const whereClause: any = { userId };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.from || filters?.to) {
      whereClause.appointmentDate = {};
      if (filters.from) {
        whereClause.appointmentDate.gte = new Date(`${filters.from}T00:00:00.000Z`);
      }
      if (filters.to) {
        whereClause.appointmentDate.lte = new Date(`${filters.to}T23:59:59.999Z`);
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    return appointments;
  }

  async getAppointmentById(userId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
    }

    if (appointment.userId !== userId) {
      throw new AppError('You do not have permission to view this appointment', 403, 'FORBIDDEN');
    }

    return appointment;
  }

  async updateAppointmentStatus(
    userId: string,
    appointmentId: string,
    status: AppointmentStatus
  ) {
    const appointment = await this.getAppointmentById(userId, appointmentId);

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status }
    });

    logger.info('Appointment status updated', {
      appointmentId: updated.id,
      newStatus: status,
      userId
    });

    return updated;
  }

  async validateAppointment(userId: string, data: CreateAppointmentInput) {
    const appointmentDateObj = new Date(`${data.appointmentDate}T00:00:00.000Z`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(`${data.appointmentDate}T00:00:00`);
    if (checkDate < today) {
      throw new AppError('Cannot schedule appointments for past dates', 400, 'INVALID_DATE');
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        userId,
        appointmentDate: appointmentDateObj,
        appointmentTime: data.appointmentTime,
        status: {
          not: AppointmentStatus.CANCELLED
        }
      }
    });

    if (existingAppointment) {
      throw new AppError(
        `Time slot ${data.appointmentTime} on ${data.appointmentDate} is already booked.`,
        409,
        'APPOINTMENT_CONFLICT'
      );
    }

    return {
      available: true,
      service: data.service,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime
    };
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
