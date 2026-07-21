import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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
}

export class CancelRideDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
