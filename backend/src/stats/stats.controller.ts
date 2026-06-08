import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('admin')
  @Roles('ADMIN')
  async getAdminStats() {
    return this.statsService.getAdminStats();
  }
}
