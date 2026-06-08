import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles('ADMIN', 'DOCTOR')
  async create(@Body() body: any) {
    return this.prescriptionsService.create(body);
  }

  @Get('patient/:id')
  @Roles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT')
  async findByPatient(@Param('id') id: string) {
    return this.prescriptionsService.findByPatient(id);
  }
}
