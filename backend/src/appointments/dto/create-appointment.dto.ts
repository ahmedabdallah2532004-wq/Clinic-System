import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
