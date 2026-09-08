import { AppointmentService } from '../src/services/appointment.service';
import prisma from '../src/db/prisma';
import { AppointmentStatus } from '@prisma/client';

jest.mock('../src/db/prisma', () => ({
  appointment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  const userId = 'user-uuid-1';

  beforeEach(() => {
    jest.clearAllMocks();
    appointmentService = new AppointmentService();
  });

  describe('createAppointment', () => {
    it('should create an appointment when slot is available and date is in future', async () => {
      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.appointment.create as jest.Mock).mockResolvedValue({
        id: 'apt-uuid-1',
        userId,
        service: 'General Dental Checkup',
        appointmentDate: new Date(`${dateStr}T00:00:00.000Z`),
        appointmentTime: '14:00',
        status: AppointmentStatus.CONFIRMED,
        notes: 'Regular checkup'
      });

      const result = await appointmentService.createAppointment(userId, {
        service: 'General Dental Checkup',
        appointmentDate: dateStr,
        appointmentTime: '14:00',
        notes: 'Regular checkup'
      });

      expect(result.id).toBe('apt-uuid-1');
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(prisma.appointment.create).toHaveBeenCalled();
    });

    it('should throw 400 INVALID_DATE if appointment date is in the past', async () => {
      const pastDate = '2020-01-01';

      await expect(
        appointmentService.createAppointment(userId, {
          service: 'Dental Checkup',
          appointmentDate: pastDate,
          appointmentTime: '14:00'
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_DATE'
      });

      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw 409 APPOINTMENT_CONFLICT if user already has an active booking at date and time', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const dateStr = future.toISOString().split('T')[0];

      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-apt-id',
        userId,
        appointmentDate: new Date(`${dateStr}T00:00:00.000Z`),
        appointmentTime: '15:00',
        status: AppointmentStatus.CONFIRMED
      });

      await expect(
        appointmentService.createAppointment(userId, {
          service: 'Dermatology Consultation',
          appointmentDate: dateStr,
          appointmentTime: '15:00'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'APPOINTMENT_CONFLICT'
      });

      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });
  });

  describe('getAppointmentById', () => {
    it('should throw 403 FORBIDDEN if user attempts to access another user appointment', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        id: 'apt-other-user',
        userId: 'other-user-uuid',
        service: 'Eye Examination'
      });

      await expect(
        appointmentService.getAppointmentById('my-user-id', 'apt-other-user')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });

    it('should throw 404 APPOINTMENT_NOT_FOUND if appointment does not exist', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentService.getAppointmentById(userId, 'non-existent-id')
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'APPOINTMENT_NOT_FOUND'
      });
    });
  });
});
