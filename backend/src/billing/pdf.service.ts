import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async generateInvoice(invoiceData: any): Promise<Buffer> {
    const settings = (await this.prisma.clinicSetting.findFirst()) as any;
    const vatRate = settings?.vatPercentage || 15;

    const subtotal = Number(invoiceData.totalAmount) / (1 + vatRate / 100);
    const vatAmount = Number(invoiceData.totalAmount) - subtotal;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .fontSize(20)
        .text(settings?.clinicName || 'Clinic Management System', {
          align: 'center',
        });
      doc.fontSize(10).text(settings?.clinicAddress || '', { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).text('INVOICE / فاتورة ضريبية', { underline: true });
      doc.moveDown();

      // Info Grid
      doc.fontSize(10);
      doc.text(`Invoice ID: #INV-${invoiceData.id.slice(0, 8).toUpperCase()}`);
      doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`);
      doc.text(`Status: ${invoiceData.status}`);
      doc.moveDown();

      doc.text(`Patient: ${invoiceData.patient.fullName}`);
      doc.moveDown();

      // Table Header
      doc.rect(50, doc.y, 500, 20).fill('#f3f4f6');
      doc.fillColor('#000').text('Description', 60, doc.y + 5);
      doc.text('Amount', 450, doc.y - 12);
      doc.moveDown();

      // Line Item (Simplified for now)
      doc.text('Medical Services / خدمات طبية', 60, doc.y + 10);
      doc.text(`${subtotal.toFixed(2)}`, 450, doc.y - 12);
      doc.moveDown();

      // Totals
      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 350, doc.y);
      doc.text(`VAT (${vatRate}%): ${vatAmount.toFixed(2)}`, 350, doc.y + 15);
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(
          `Total: ${Number(invoiceData.totalAmount).toFixed(2)} SAR`,
          350,
          doc.y + 35,
        );

      doc
        .font('Helvetica')
        .fontSize(10)
        .text('Thank you for choosing our clinic.', 50, 700, {
          align: 'center',
        });

      doc.end();
    });
  }
}
