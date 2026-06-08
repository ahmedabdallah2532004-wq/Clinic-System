import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  createInvoice(@Body() data: any) {
    return this.billingService.createInvoice(data);
  }

  @Post('payments')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  addPayment(
    @Body() data: { invoiceId: string; amount: number; method: string },
  ) {
    return this.billingService.addPayment(
      data.invoiceId,
      data.amount,
      data.method,
    );
  }

  @Post('payments/bulk')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  addBulkPayments(@Body() data: { invoiceIds: string[]; method: string }) {
    return this.billingService.addBulkPayments(data);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll() {
    return this.billingService.getInvoices();
  }

  @Get('invoices/patient/:id')
  @Roles(UserRole.ADMIN, UserRole.PATIENT, UserRole.RECEPTIONIST)
  findByPatient(@Param('id') id: string) {
    return this.billingService.getInvoicesByPatient(id);
  }

  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async exportCsv(@Res() res: Response) {
    const csv = await this.billingService.getCsvReport();
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename=financial_report.csv');
    return res.send(csv);
  }
}
