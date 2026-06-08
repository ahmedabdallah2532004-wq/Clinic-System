import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import * as express from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAnalytics() {
    return this.reportsService.getAnalytics();
  }

  @Get('prescription/:id')
  async getPrescriptionPDF(@Param('id') id: string, @Res() res: express.Response) {
    const data = await this.reportsService.getPrescriptionData(id);
    return this.reportsService.generatePrescriptionPDF(data, res);
  }

  @Get('invoice/:id')
  async getInvoicePDF(@Param('id') id: string, @Res() res: express.Response) {
    const data = await this.reportsService.getInvoiceData(id);
    return this.reportsService.generateInvoicePDF(data, res);
  }

  @Get('doctor-daily/:id')
  async getDoctorDailyPDF(@Param('id') id: string, @Res() res: express.Response) {
    const data = await this.reportsService.getDoctorDailyData(id);
    return this.reportsService.generateDoctorDailyPDF(data, res);
  }
}
