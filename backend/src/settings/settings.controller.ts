import { Controller, Get, Post, Body, Param, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('logo/:filename')
  async getLogo(@Param('filename') filename: string, @Res() res: any) {
    return res.sendFile(filename, { root: './uploads' });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `clinic-logo-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const logoUrl = `${process.env.API_URL || 'http://localhost:3001'}/settings/logo/${file.filename}`;
    await this.settingsService.updateSettings({ clinicLogo: logoUrl });
    return { url: logoUrl };
  }
}
