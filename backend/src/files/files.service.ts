import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async createFile(data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    patientId?: string;
    encounterId?: string;
  }) {
    return this.prisma.fileAsset.create({
      data,
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.fileAsset.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEncounter(encounterId: string) {
    return this.prisma.fileAsset.findMany({
      where: { encounterId },
    });
  }
}
