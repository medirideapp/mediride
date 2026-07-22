import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import {
  AttachPassDto,
  CreateOrganizationDto,
  CreatePassDto,
} from './dto/organizations.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('organizations')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class OrganizationsController {
  constructor(private orgs: OrganizationsService) {}

  @Get()
  list() {
    return this.orgs.listOrgs();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.createOrg(user.userId, dto);
  }

  @Get('passes')
  passes(@Query('organizationId') organizationId?: string) {
    return this.orgs.listPasses(organizationId);
  }

  @Post(':orgId/passes')
  createPass(@Param('orgId') orgId: string, @Body() dto: CreatePassDto) {
    return this.orgs.createPass(orgId, dto);
  }

  @Post('rides/:rideId/attach-pass')
  attach(@Param('rideId') rideId: string, @Body() dto: AttachPassDto) {
    return this.orgs.attachPassToRide(rideId, dto.passId);
  }
}
