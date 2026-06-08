import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MedicalServicesService } from './medical-services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('medical-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalServicesController {
  constructor(
    private readonly medicalServicesService: MedicalServicesService,
  ) {}

  @Get()
  findAll() {
    return this.medicalServicesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() data: any) {
    return this.medicalServicesService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() data: any) {
    return this.medicalServicesService.update(+id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.medicalServicesService.remove(+id);
  }
}
