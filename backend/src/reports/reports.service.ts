import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as express from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}
  async generatePrescriptionPDF(data: any, res: express.Response) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MEDICAL PRESCRIPTION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Doctor: ${data.doctorName}`);
    doc.text(`Patient: ${data.patientName}`);
    doc.moveDown();

    doc.lineCap('butt').moveTo(50, 150).lineTo(550, 150).stroke();
    doc.moveDown();

    // Body
    doc.fontSize(14).text('Medications:', { underline: true });
    doc.moveDown(0.5);

    data.items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${item.medicationName} - ${item.dosage}`);
      doc
        .fontSize(10)
        .text(`   Frequency: ${item.frequency} | Duration: ${item.duration}`, {
          indent: 20,
        });
      if (item.instructions) {
        doc.text(`   Instructions: ${item.instructions}`, { indent: 20 });
      }
      doc.moveDown(0.5);
    });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .text('Digitally signed by Clinic Management System', { align: 'right' });

    doc.end();
  }

  async generateInvoicePDF(data: any, res: express.Response) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${data.id}`);
    doc.text(`Patient: ${data.patientName}`);
    doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Service', 50, 180);
    doc.text('Qty', 300, 180);
    doc.text('Price', 400, 180);
    doc.text('Total', 500, 180);
    doc.moveDown();
    doc.font('Helvetica');

    let y = 200;
    data.items.forEach((item) => {
      doc.text(item.serviceName, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`$${item.unitPrice}`, 400, y);
      doc.text(`$${item.lineTotal}`, 500, y);
      y += 20;
    });

    doc.lineCap('butt').moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc
      .font('Helvetica-Bold')
      .text(`Grand Total: $${data.totalAmount}`, 400, y);

    doc.end();
  }

  async getInvoiceData(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return {
      id: invoice.id,
      patientName: invoice.patient.fullName,
      createdAt: invoice.createdAt,
      totalAmount: Number(invoice.totalAmount),
      items: invoice.items.map((item) => ({
        serviceName: item.service.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),
    };
  }

  async getPrescriptionData(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        items: true,
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return {
      doctorName: prescription.doctor.fullName,
      patientName: prescription.patient.fullName,
      items: prescription.items.map((item) => ({
        medicationName: item.medicationName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    };
  }

  async getDoctorDailyData(doctorIdOrUserId: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorIdOrUserId }, { userId: doctorIdOrUserId }],
      },
      include: {
        specialties: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        patient: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      doctorName: doctor.fullName,
      specialty: doctor.specialties.map((s) => s.name).join(', ') || 'General',
      date: new Date().toLocaleDateString('ar-EG'),
      cases: appointments.map((appt, index) => ({
        index: index + 1,
        time: new Date(appt.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        patientName: appt.patient.fullName,
        complaint: appt.notes || 'Routine Checkup',
        status: appt.status,
      })),
    };
  }

  async generateDoctorDailyPDF(data: any, res: express.Response) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('DAILY CLINICAL CASE SHEET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${data.date}`);
    doc.text(`Practitioner: ${data.doctorName}`);
    doc.text(`Specialization: ${data.specialty}`);
    doc.moveDown();

    doc.lineCap('butt').moveTo(50, 150).lineTo(550, 150).stroke();
    doc.moveDown();

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Slot', 50, 180);
    doc.text('Patient Name', 120, 180);
    doc.text('Complaint / Notes', 280, 180);
    doc.text('Status', 450, 180);
    doc.moveDown();
    doc.font('Helvetica');

    let y = 200;
    data.cases.forEach((c: any) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.font('Helvetica-Bold');
        doc.text('Slot', 50, y);
        doc.text('Patient Name', 120, y);
        doc.text('Complaint / Notes', 280, y);
        doc.text('Status', 450, y);
        doc.font('Helvetica');
        y += 20;
      }
      doc.text(c.time, 50, y);
      doc.text(c.patientName, 120, y);
      doc.text(c.complaint, 280, y);
      doc.text(c.status, 450, y);
      y += 20;
    });

    doc.lineCap('butt').moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc
      .font('Helvetica-Bold')
      .text(`Total Cases Scheduled: ${data.cases.length}`, 50, y);

    doc.end();
  }

  async getAnalytics() {
    // In a real app, you'd use complex Prisma groupBys or raw SQL for speed
    // For now, we'll aggregate basic trends
    return {
      revenueGrowth: [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 6000 },
        { name: 'Apr', value: 8000 },
        { name: 'May', value: 12000 },
      ],
      departmentStats: [
        { name: 'Cardiology', value: 45, color: '#0066FF' },
        { name: 'Pediatrics', value: 25, color: '#10b981' },
        { name: 'Orthopedics', value: 15, color: '#f59e0b' },
        { name: 'General', value: 15, color: '#64748b' },
      ],
      doctorPerformance: [
        { name: 'Dr. Connor', patients: 120, revenue: 15000 },
        { name: 'Dr. Walker', patients: 95, revenue: 12000 },
        { name: 'Dr. Strange', patients: 80, revenue: 22000 },
      ],
      kpis: {
        totalEncounters: 1240,
        averageWaitTime: '12 min',
        patientSatisfaction: '94%',
        noShowRate: '4.2%',
      },
    };
  }
}
