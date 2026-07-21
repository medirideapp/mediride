import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DriversService } from './drivers.service';
import {
  UpdateDriverStatusDto,
  UpdateLocationDto,
  UpsertVehicleDto,
} from './dto/drivers.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('drivers')
@UseGuards(RolesGuard)
@Roles(Role.DRIVER, Role.ADMIN)
export class DriversController {
  constructor(private drivers: DriversService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.drivers.getProfile(user.userId);
  }

  @Patch('status')
  status(@CurrentUser() user: AuthUser, @Body() dto: UpdateDriverStatusDto) {
    return this.drivers.setStatus(user.userId, dto.status);
  }

  @Patch('location')
  location(@CurrentUser() user: AuthUser, @Body() dto: UpdateLocationDto) {
    return this.drivers.updateLocation(user.userId, dto);
  }

  @Post('vehicle')
  vehicle(@CurrentUser() user: AuthUser, @Body() dto: UpsertVehicleDto) {
    return this.drivers.upsertVehicle(user.userId, dto);
  }
}
