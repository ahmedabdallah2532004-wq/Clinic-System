import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockPrisma = {
    appointment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);

    // Reset jest mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an appointment when no overlaps exist', async () => {
      const dto = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        notes: 'Checkup',
        status: AppointmentStatus.SCHEDULED,
      };

      // Mock finding no overlapping doctor or patient appointments
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue({ id: 'app-1', ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 'app-1');
      expect(mockPrisma.appointment.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException if doctor has an overlapping appointment', async () => {
      const dto = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      // Mock doctor overlap
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({
        id: 'existing-app',
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.appointment.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if patient has an overlapping appointment', async () => {
      const dto = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      // Mock first find (doctor check) returns null, second find (patient check) returns overlap
      mockPrisma.appointment.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-app' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.appointment.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('reschedule', () => {
    it('should throw NotFoundException if appointment does not exist', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.reschedule(
          'non-existent',
          new Date(Date.now() + 3600000).toISOString(),
          new Date(Date.now() + 7200000).toISOString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully reschedule when no overlap conflicts exist', async () => {
      const existingAppt = {
        id: 'app-1',
        doctorId: 'doctor-1',
        patientId: 'patient-1',
      };
      const newStart = new Date(Date.now() + 3600000).toISOString();
      const newEnd = new Date(Date.now() + 7200000).toISOString();

      mockPrisma.appointment.findUnique.mockResolvedValue(existingAppt);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.update.mockResolvedValue({
        ...existingAppt,
        startTime: new Date(newStart),
        endTime: new Date(newEnd),
      });

      const result = await service.reschedule('app-1', newStart, newEnd);
      expect(result.startTime).toBeDefined();
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: {
          startTime: new Date(newStart),
          endTime: new Date(newEnd),
        },
      });
    });

    it('should throw ConflictException if reschedule slot conflicts with another appointment', async () => {
      const existingAppt = {
        id: 'app-1',
        doctorId: 'doctor-1',
        patientId: 'patient-1',
      };
      const newStart = new Date(Date.now() + 3600000).toISOString();
      const newEnd = new Date(Date.now() + 7200000).toISOString();

      mockPrisma.appointment.findUnique.mockResolvedValue(existingAppt);
      mockPrisma.appointment.findFirst.mockResolvedValue({
        id: 'conflicting-appt',
      });

      await expect(
        service.reschedule('app-1', newStart, newEnd),
      ).rejects.toThrow(ConflictException);
    });
  });
});
