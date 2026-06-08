import { Module } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { BillingController } from './billing.controller.js';
import { PdfService } from './pdf.service.js';

@Module({
  controllers: [BillingController],
  providers: [BillingService, PdfService],
})
export class BillingModule {}
