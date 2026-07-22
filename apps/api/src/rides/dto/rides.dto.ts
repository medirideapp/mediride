import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AssistanceLevel } from '@prisma/client';

export class CreateRideDto {
  @IsString()
  pickupAddress!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng!: number;

  @IsString()
  dropoffAddress!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLng!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Schedule for later (ISO string). Omit for ASAP. */
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsEnum(AssistanceLevel)
  assistanceLevel?: AssistanceLevel;

  @IsOptional()
  @IsBoolean()
  wheelchairNeeded?: boolean;

  @IsOptional()
  @IsString()
  ridePurpose?: string;

  @IsOptional()
  @IsString()
  organizationName?: string;

  /** Attach Lyft Pass–style org budget at booking time */
  @IsOptional()
  @IsString()
  passId?: string;
}

/** Clinic/admin books a ride for a patient (Lyft Concierge style) */
export class ConciergeRideDto extends CreateRideDto {
  @IsString()
  patientName!: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  /** Existing rider account email, or leave blank to attach to booking admin as placeholder rider */
  @IsOptional()
  @IsString()
  riderEmail?: string;
}

export class CancelRideDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
