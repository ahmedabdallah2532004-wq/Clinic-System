import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(data: { 
    encounterId?: string; 
    patientId: string; 
    dueDate: Date; 
    totalAmount: number;
    items?: { serviceId: number; quantity: number; unitPrice: number }[]
  }) {
    return this.prisma.invoice.create({
      data: {
        encounterId: data.encounterId,
        patientId: data.patientId,
        dueDate: new Date(data.dueDate),
        totalAmount: data.totalAmount,
        status: PaymentStatus.PENDING,
        items: data.items && data.items.length > 0 ? {
          create: data.items.map(item => ({
            serviceId: Number(item.serviceId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          }))
        } : undefined
      },
      include: {
        patient: true,
        items: {
          include: {
            service: true
          }
        }
      }
    });
  }

  async addPayment(invoiceId: string, amount: number, method: string) {
    if (amount <= 0) {
      throw new ConflictException('Payment amount must be greater than zero');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount,
        paymentMethod: method,
      },
    });

    // Sum all payments for this invoice
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0) + amount;

    if (totalPaid >= Number(invoice.totalAmount)) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: PaymentStatus.PAID },
      });
    }

    return payment;
  }

  async addBulkPayments(data: { invoiceIds: string[]; method: string }) {
    if (!data.invoiceIds || data.invoiceIds.length === 0) {
      throw new ConflictException('No invoice IDs provided');
    }

    return this.prisma.$transaction(async (tx) => {
      const payments: any[] = [];

      for (const invoiceId of data.invoiceIds) {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true }
        });

        if (!invoice) {
          throw new NotFoundException(`Invoice ${invoiceId} not found`);
        }

        if (invoice.status === PaymentStatus.PAID) {
          continue;
        }

        const remainingAmount = Number(invoice.totalAmount) - (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        if (remainingAmount <= 0) {
          continue;
        }

        const payment = await tx.payment.create({
          data: {
            invoiceId,
            amount: remainingAmount,
            paymentMethod: data.method,
          },
        });

        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: PaymentStatus.PAID },
        });

        payments.push(payment);
      }

      return payments;
    });
  }

  async getInvoices() {
    return this.prisma.invoice.findMany({
      include: {
        patient: true,
        encounter: {
          include: {
            doctor: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getInvoicesByPatient(patientId: string) {
    return this.prisma.invoice.findMany({
      where: { patientId },
      include: {
        items: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCsvReport() {
    const invoices = await this.getInvoices();
    
    // CSV Header
    let csv = '\ufeff'; // UTF-8 BOM for Excel Arabic support
    csv += 'رقم الفاتورة,المريض,التاريخ,المبلغ الإجمالي,الحالة\n';

    invoices.forEach(inv => {
      csv += `${inv.id},${inv.patient.fullName},${inv.createdAt.toISOString().split('T')[0]},${inv.totalAmount},${inv.status}\n`;
    });

    return csv;
  }
}
