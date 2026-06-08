import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class EncountersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    chiefComplaint: string;
    notes?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    vitals?: {
      bloodPressure?: string;
      temperatureC?: number;
      pulseRate?: number;
      weightKg?: number;
      heightCm?: number;
    };
    prescriptions?: {
      medicationName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  }) {
    // Start transaction to create encounter and invoice
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Encounter
      const encounter = await tx.encounter.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId,
          chiefComplaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatmentPlan: data.treatmentPlan,
        },
      });

      // 2. Create Vitals if provided
      if (data.vitals) {
        await tx.vitals.create({
          data: {
            encounterId: encounter.id,
            bloodPressure: data.vitals.bloodPressure,
            temperatureC: data.vitals.temperatureC,
            pulseRate: data.vitals.pulseRate,
            weightKg: data.vitals.weightKg,
            heightCm: data.vitals.heightCm,
          },
        });
      }

      // 3. Create Prescription if provided
      if (data.prescriptions && data.prescriptions.length > 0) {
        await tx.prescription.create({
          data: {
            encounterId: encounter.id,
            patientId: data.patientId,
            doctorId: data.doctorId,
            items: {
              create: data.prescriptions.map((item) => ({
                medicationName: item.medicationName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions,
              })),
            },
          },
        });
      }

      // 4. Update Appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: { status: 'COMPLETED' },
      });

      // 5. Create automatic Invoice for the visit
      // Base visit fee: $100
      await tx.invoice.create({
        data: {
          patientId: data.patientId,
          encounterId: encounter.id,
          totalAmount: 100.0,
          status: PaymentStatus.PENDING,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days due
        },
      });

      return encounter;
    });
  }

  async findAll() {
    return this.prisma.encounter.findMany({
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.encounter.findMany({
      where: { patientId },
      include: { doctor: true, prescription: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
