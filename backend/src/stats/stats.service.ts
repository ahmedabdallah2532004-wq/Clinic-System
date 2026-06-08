import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      patientCount, 
      appointmentCount, 
      revenue, 
      recentInvoices, 
      specialties,
      patientsToday,
      appointmentsToday
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        take: 5,
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.specialty.findMany({
        include: {
          _count: {
            select: { doctors: true }
          }
        }
      }),
      this.prisma.patient.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.appointment.count({
        where: { startTime: { gte: today } }
      })
    ]);

    // Calculate revenue for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const revenueTrends = await Promise.all(last7Days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dailySum = await this.prisma.payment.aggregate({
        where: {
          paidAt: {
            gte: day,
            lt: nextDay
          }
        },
        _sum: { amount: true }
      });
      return { 
        name: day.toLocaleDateString('en-US', { weekday: 'short' }), 
        value: Number(dailySum._sum?.amount || 0)
      };
    }));

    return {
      totalPatients: patientCount,
      totalAppointments: appointmentCount,
      totalRevenue: Number(revenue._sum?.amount || 0),
      patientsToday,
      appointmentsToday,
      growthRate: 12.5,
      revenueTrends,
      departmentStats: specialties.map(s => ({
        name: s.name,
        value: s._count.doctors,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      })),
      recentInvoices: recentInvoices.map(inv => ({
        id: inv.id,
        patientName: inv.patient.fullName,
        amount: Number(inv.totalAmount),
        status: inv.status
      }))
    };
  }
}
