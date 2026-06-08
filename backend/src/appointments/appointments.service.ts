import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const now = new Date();

    if (start < now) {
      throw new ConflictException('عذراً، لا يمكن حجز مواعيد في الماضي.');
    }

    if (start >= end) {
      throw new ConflictException('يجب أن يكون وقت البداية قبل وقت النهاية.');
    }

    // 1. Check for double booking (Doctor)
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NOSHOW] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlapping) {
      throw new ConflictException('هذا الطبيب لديه موعد آخر في نفس الفترة المحددة.');
    }

    // 2. Check for double booking (Patient)
    const patientOverlapping = await this.prisma.appointment.findFirst({
      where: {
        patientId: dto.patientId,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NOSHOW] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (patientOverlapping) {
      throw new ConflictException('المريض لديه موعد آخر متداخل في هذا الوقت.');
    }

    // 3. Create the appointment
    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        startTime: start,
        endTime: end,
        notes: dto.notes,
        status: dto.status || AppointmentStatus.SCHEDULED,
      },
    });
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async findByDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId }
        ]
      }
    });
    const actualDoctorId = doctor ? doctor.id : doctorId;

    return this.prisma.appointment.findMany({
      where: { doctorId: actualDoctorId },
      include: {
        patient: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async reschedule(id: string, startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      throw new ConflictException('عذراً، لا يمكن إعادة جدولة الموعد في الماضي.');
    }

    if (start >= end) {
      throw new ConflictException('يجب أن يكون وقت البداية قبل وقت النهاية.');
    }

    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('الموعد غير موجود.');

    // Check doctor availability overlap excluding current appointment
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appt.doctorId,
        status: { notIn: ['CANCELLED', 'NOSHOW'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlapping) {
      throw new ConflictException('هذا الطبيب لديه موعد آخر متداخل في هذا الوقت.');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
      },
    });
  }

  async blockTime(body: { doctorId: string; startTime: string; endTime: string; reason?: string }) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: body.doctorId },
          { userId: body.doctorId }
        ]
      }
    });
    const actualDoctorId = doctor ? doctor.id : body.doctorId;

    let blockedPatient = await this.prisma.patient.findFirst({
      where: { fullName: 'Blocked Time' }
    });

    if (!blockedPatient) {
      blockedPatient = await this.prisma.patient.create({
        data: {
          fullName: 'Blocked Time',
          dateOfBirth: new Date('1970-01-01'),
          gender: 'OTHER',
          contactNumber: '0000000000',
        }
      });
    }

    return this.prisma.appointment.create({
      data: {
        patientId: blockedPatient.id,
        doctorId: actualDoctorId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.reason || 'Blocked Time Slot',
        status: 'SCHEDULED',
      }
    });
  }
}
