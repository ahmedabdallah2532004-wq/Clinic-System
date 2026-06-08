import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('encounters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncountersController {
  constructor(private encountersService: EncountersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async create(@Body() body: any) {
    return this.encountersService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async findAll() {
    return this.encountersService.findAll();
  }

  @Get('patient/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async findByPatient(@Param('id') id: string) {
    return this.encountersService.findByPatient(id);
  }
}
