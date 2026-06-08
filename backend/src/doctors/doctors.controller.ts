import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() data: any) {
    return this.doctorsService.create(data);
  }

  @Post('onboard')
  @Roles(UserRole.ADMIN)
  onboard(@Body() data: any) {
    return this.doctorsService.onboard(data);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('specialties')
  findSpecialties() {
    return this.doctorsService.findSpecialties();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  update(@Param('id') id: string, @Body() data: any) {
    return this.doctorsService.update(id, data);
  }
}
