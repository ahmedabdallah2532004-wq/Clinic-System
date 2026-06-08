import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicalServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        category: data.category || 'GENERAL',
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        category: data.category,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
