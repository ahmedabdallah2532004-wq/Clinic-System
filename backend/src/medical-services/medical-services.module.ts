import { Module } from '@nestjs/common';
import { MedicalServicesController } from './medical-services.controller';
import { MedicalServicesService } from './medical-services.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalServicesController],
  providers: [MedicalServicesService],
  exports: [MedicalServicesService],
})
export class MedicalServicesModule {}
