import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Patient } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.patient.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
          include: { doctor: true }
        },
        encounters: {
          orderBy: { createdAt: 'desc' },
          include: { doctor: true }
        },
        prescriptions: {
          include: { doctor: true, items: true }
        },
        invoices: {
          where: { status: 'PENDING' }
        }
      }
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          include: { doctor: true }
        },
        encounters: {
          orderBy: { createdAt: 'desc' },
          include: { 
            doctor: true,
            vitals: true,
            prescription: {
              include: { items: true }
            }
          }
        },
        prescriptions: {
          orderBy: { issuedAt: 'desc' },
          include: { doctor: true, items: true }
        },
        files: {
          orderBy: { createdAt: 'desc' }
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, data: Prisma.PatientUpdateInput) {
    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.patient.delete({
      where: { id },
    });
  }
}
