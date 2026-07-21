import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverStatusDto {
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class UpsertVehicleDto {
  @IsString()
  make!: string;

  @IsString()
  model!: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsString()
  plateNumber!: string;

  @IsOptional()
  @IsBoolean()
  wheelchair?: boolean;
}
