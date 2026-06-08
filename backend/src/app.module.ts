import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BillingModule } from './billing/billing.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ReportsModule } from './reports/reports.module';
import { FilesModule } from './files/files.module';
import { SettingsModule } from './settings/settings.module';
import { MedicalServicesModule } from './medical-services/medical-services.module';
import { CommonModule } from './common/common.module';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { SchedulesModule } from './schedules/schedules.module';
import { StatsController } from './stats/stats.controller';
import { StatsService } from './stats/stats.service';
import { PrescriptionsController } from './prescriptions/prescriptions.controller';
import { PrescriptionsService } from './prescriptions/prescriptions.service';
import { EncountersController } from './encounters/encounters.controller';
import { EncountersService } from './encounters/encounters.service';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    PatientsModule, 
    AppointmentsModule, 
    BillingModule,
    DoctorsModule,
    ReportsModule,
    SchedulesModule,
    FilesModule,
    SettingsModule,
    MedicalServicesModule,
    CommonModule
  ],
  controllers: [AppController, StatsController, PrescriptionsController, EncountersController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    StatsService,
    PrescriptionsService,
    EncountersService,
  ],
})
export class AppModule {}
