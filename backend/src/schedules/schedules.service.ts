import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async setSchedule(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ) {
    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('Invalid day of week');
    }

    // Upsert schedule using composite unique key
    return this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId,
          dayOfWeek,
        },
      } as any,
      update: {
        startTime,
        endTime,
        isActive: true,
      },
      create: {
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
      },
    });
  }

  async getDoctorSchedule(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async isDoctorAvailable(doctorId: string, date: Date): Promise<boolean> {
    const dayOfWeek = date.getDay();
    const timeString = date.toTimeString().split(' ')[0]; // HH:mm:ss

    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
        startTime: { lte: timeString },
        endTime: { gte: timeString },
      },
    });

    return !!schedule;
  }
}
