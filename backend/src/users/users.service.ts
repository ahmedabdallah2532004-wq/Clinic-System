import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async create(data: {
    email: string;
    password: string;
    roles?: UserRole[];
    role?: UserRole;
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    contactNumber?: string;
  }) {
    // 1. Validation
    if (data.password.length < 6) {
      throw new ConflictException(
        'Password must be at least 6 characters long',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const roleNames =
      data.roles || (data.role ? [data.role] : [UserRole.PATIENT]);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        roles: {
          connect: roleNames.map((r) => ({ name: r })),
        },
        ...(roleNames.includes(UserRole.PATIENT) && data.fullName
          ? {
              patient: {
                create: {
                  fullName: data.fullName,
                  dateOfBirth: data.dateOfBirth
                    ? new Date(data.dateOfBirth)
                    : new Date(),
                  gender: (data.gender?.toUpperCase() as any) || 'OTHER',
                  contactNumber: data.contactNumber || '',
                },
              },
            }
          : {}),
      },
      include: { roles: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { roles: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: true,
        patient: true,
        doctor: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        patient: true,
        doctor: true,
      },
    });
    if (!user) throw new ConflictException('User not found');

    const roleNames = user.roles.map((r) => r.name);
    let fullName = '';
    let contactNumber = '';

    if (roleNames.includes('PATIENT') && user.patient) {
      fullName = user.patient.fullName;
      contactNumber = user.patient.contactNumber;
    } else if (roleNames.includes('DOCTOR') && user.doctor) {
      fullName = user.doctor.fullName;
      contactNumber = '';
    } else if (roleNames.includes('ADMIN')) {
      fullName = 'System Administrator';
      contactNumber = '';
    } else if (roleNames.includes('RECEPTIONIST')) {
      fullName = 'Receptionist Desk';
      contactNumber = '';
    }

    return {
      id: user.id,
      email: user.email,
      roles: roleNames,
      fullName,
      contactNumber,
      patient: user.patient,
      doctor: user.doctor,
    };
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; contactNumber?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, patient: true, doctor: true },
    });
    if (!user) throw new ConflictException('User not found');

    const roleNames = user.roles.map((r) => r.name);

    if (roleNames.includes('PATIENT') && user.patient) {
      await this.prisma.patient.update({
        where: { id: user.patient.id },
        data: {
          fullName: data.fullName || user.patient.fullName,
          contactNumber: data.contactNumber || user.patient.contactNumber,
        },
      });
    } else if (roleNames.includes('DOCTOR') && user.doctor) {
      await this.prisma.doctor.update({
        where: { id: user.doctor.id },
        data: {
          fullName: data.fullName || user.doctor.fullName,
        },
      });
    }

    return this.getProfile(userId);
  }
}
