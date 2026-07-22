import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RidesService } from './rides.service';
import { CancelRideDto, ConciergeRideDto, CreateRideDto } from './dto/rides.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('rides')
@UseGuards(RolesGuard)
export class RidesController {
  constructor(private rides: RidesService) {}

  @Post()
  @Roles(Role.RIDER, Role.ADMIN)
  request(@CurrentUser() user: AuthUser, @Body() dto: CreateRideDto) {
    return this.rides.requestRide(user.userId, dto);
  }

  /** Lyft Concierge: book a ride for a patient (no patient app required) */
  @Post('concierge')
  @Roles(Role.ADMIN)
  concierge(@CurrentUser() user: AuthUser, @Body() dto: ConciergeRideDto) {
    return this.rides.conciergeRide(user.userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.rides.listMyRides(user.userId, user.role as Role);
  }

  @Get('open')
  @Roles(Role.DRIVER, Role.ADMIN)
  open(@CurrentUser() user: AuthUser) {
    return this.rides.listOpenRequests(user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rides.getRide(id, user.userId, user.role as Role);
  }

  @Patch(':id/accept')
  @Roles(Role.DRIVER)
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rides.acceptRide(id, user.userId);
  }

  @Patch(':id/arriving')
  @Roles(Role.DRIVER)
  arriving(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rides.markArriving(id, user.userId);
  }

  @Patch(':id/confirm-start')
  @Roles(Role.RIDER, Role.DRIVER)
  confirmStart(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rides.confirmStart(id, user.userId, user.role as Role);
  }

  @Patch(':id/confirm-stop')
  @Roles(Role.RIDER, Role.DRIVER)
  confirmStop(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rides.confirmStop(id, user.userId, user.role as Role);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CancelRideDto,
  ) {
    return this.rides.cancelRide(id, user.userId, user.role as Role, dto.reason);
  }
}
