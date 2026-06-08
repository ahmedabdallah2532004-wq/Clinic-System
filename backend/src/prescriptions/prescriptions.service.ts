import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    patientId: string;
    doctorId: string;
    encounterId: string;
    items: any[];
  }) {
    // Verify encounter exists
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: data.encounterId },
    });

    if (!encounter) throw new NotFoundException('Encounter not found');

    // Create prescription with items in a transaction
    return this.prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        encounterId: data.encounterId,
        items: {
          create: data.items.map((item) => ({
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        items: true,
        doctor: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
