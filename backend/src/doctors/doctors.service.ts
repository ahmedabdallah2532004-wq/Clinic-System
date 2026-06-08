import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    fullName: string;
    licenseNumber: string;
    bio?: string;
    specialtyIds?: number[];
  }) {
    // Ensure doctor profile doesn't exist for user
    const existing = await this.prisma.doctor.findUnique({
      where: { userId: data.userId },
    });
    if (existing) throw new ConflictException('Doctor profile already exists for this user');

    return this.prisma.doctor.create({
      data: {
        userId: data.userId,
        fullName: data.fullName,
        licenseNumber: data.licenseNumber,
        bio: data.bio,
        specialties: {
          connect: data.specialtyIds?.map(id => ({ id })) || [],
        },
      },
      include: {
        specialties: true,
      },
    });
  }

  async findAll() {
    return this.prisma.doctor.findMany({
      include: {
        specialties: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        specialties: true,
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, data: Prisma.DoctorUpdateInput) {
    return this.prisma.doctor.update({
      where: { id },
      data,
    });
  }

  async findSpecialties() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async onboard(data: {
    email: string;
    password?: string;
    fullName: string;
    licenseNumber: string;
    bio?: string;
    specialtyIds?: number[];
  }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingDoc = await this.prisma.doctor.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existingDoc) {
      throw new ConflictException('A doctor with this license number already exists');
    }

    const password = data.password || 'doctor123';
    if (password.length < 6) {
      throw new ConflictException('Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      // Create user with DOCTOR role
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          roles: {
            connect: { name: 'DOCTOR' }
          }
        }
      });

      // Create doctor profile
      return tx.doctor.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          licenseNumber: data.licenseNumber,
          bio: data.bio,
          specialties: {
            connect: data.specialtyIds?.map(id => ({ id })) || [],
          },
        },
        include: {
          specialties: true,
          user: {
            select: {
              email: true,
              isActive: true,
            }
          }
        }
      });
    });
  }
}
