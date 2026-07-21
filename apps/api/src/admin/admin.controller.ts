import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IsBoolean } from 'class-validator';

class ApproveDto {
  @IsBoolean()
  approved!: boolean;
}

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('rides')
  rides(@Query('status') status?: string) {
    return this.admin.listRides(status);
  }

  @Get('drivers')
  drivers() {
    return this.admin.listDrivers();
  }

  @Patch('drivers/:id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.admin.approveDriver(id, dto.approved);
  }
}
