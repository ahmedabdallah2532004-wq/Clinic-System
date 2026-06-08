import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { UserRole } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  create(
    @Body()
    body: {
      patientId: string;
      doctorId: string;
      startTime: string;
      endTime: string;
      notes?: string;
    },
  ) {
    return this.appointmentsService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('doctor/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findByDoctor(@Param('id') id: string) {
    return this.appointmentsService.findByDoctor(id);
  }

  @Get('patient/:id')
  @Roles(UserRole.ADMIN, UserRole.PATIENT, UserRole.RECEPTIONIST)
  findByPatient(@Param('id') id: string) {
    return this.appointmentsService.findByPatient(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.PATIENT, UserRole.RECEPTIONIST)
  reschedule(
    @Param('id') id: string,
    @Body('startTime') startTime: string,
    @Body('endTime') endTime: string,
  ) {
    return this.appointmentsService.reschedule(id, startTime, endTime);
  }

  @Post('block-time')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  blockTime(
    @Body()
    body: {
      doctorId: string;
      startTime: string;
      endTime: string;
      reason?: string;
    },
  ) {
    return this.appointmentsService.blockTime(body);
  }
}
