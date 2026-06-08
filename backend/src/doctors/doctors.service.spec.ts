import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from './doctors.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('DoctorsService', () => {
  let service: DoctorsService;

  const mockPrisma = {
    doctor: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    specialty: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if doctor profile already exists for the user', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1' });

      await expect(
        service.create({
          userId: 'user-1',
          fullName: 'Dr. John',
          licenseNumber: 'LIC123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create doctor profile', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.create.mockResolvedValue({
        id: 'doc-1',
        fullName: 'Dr. John',
      });

      const result = await service.create({
        userId: 'user-1',
        fullName: 'Dr. John',
        licenseNumber: 'LIC123',
      });

      expect(result).toHaveProperty('id', 'doc-1');
      expect(mockPrisma.doctor.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if doctor does not exist', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return doctor object if found', async () => {
      const doc = { id: 'doc-1', fullName: 'Dr. John' };
      mockPrisma.doctor.findUnique.mockResolvedValue(doc);

      const result = await service.findOne('doc-1');
      expect(result).toEqual(doc);
    });
  });

  describe('onboard', () => {
    it('should throw ConflictException if user email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.onboard({
          email: 'test@clinic.com',
          fullName: 'Dr. John',
          licenseNumber: 'LIC123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if doctor license number already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1' });

      await expect(
        service.onboard({
          email: 'test@clinic.com',
          fullName: 'Dr. John',
          licenseNumber: 'LIC123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if password is under 6 characters', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(
        service.onboard({
          email: 'test@clinic.com',
          fullName: 'Dr. John',
          licenseNumber: 'LIC123',
          password: '123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully onboard user and doctor within a transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@clinic.com',
      });
      mockPrisma.doctor.create.mockResolvedValue({
        id: 'doc-1',
        fullName: 'Dr. John',
        userId: 'user-1',
      });

      const result = await service.onboard({
        email: 'test@clinic.com',
        fullName: 'Dr. John',
        licenseNumber: 'LIC123',
        password: 'securePassword',
      });

      expect(result).toHaveProperty('id', 'doc-1');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.doctor.create).toHaveBeenCalled();
    });
  });
});
