import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

export class CreatePassDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  monthlyBudgetUsd!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRideUsd?: number;
}

export class AttachPassDto {
  @IsString()
  passId!: string;
}
