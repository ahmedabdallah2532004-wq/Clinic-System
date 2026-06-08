import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: 'SUCCESS' | 'FAILURE';
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData,
        newData: data.newData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status || 'SUCCESS',
      },
    });
  }

  async getRecentLogs() {
    return this.prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
  }
}
