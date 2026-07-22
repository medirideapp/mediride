import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, CreatePassDto } from './dto/organizations.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  listOrgs() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        passes: true,
        _count: { select: { passes: true } },
      },
    });
  }

  createOrg(ownerUserId: string, dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        contactEmail: dto.contactEmail,
        ownerUserId,
      },
      include: { passes: true },
    });
  }

  async createPass(orgId: string, dto: CreatePassDto) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    if (!org.isActive) throw new BadRequestException('Organization is inactive');

    return this.prisma.ridePass.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        monthlyBudgetUsd: dto.monthlyBudgetUsd,
        maxRideUsd: dto.maxRideUsd,
      },
    });
  }

  listPasses(orgId?: string) {
    return this.prisma.ridePass.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { rides: true } },
      },
    });
  }

  async getPassOrThrow(passId: string) {
    const pass = await this.prisma.ridePass.findUnique({
      where: { id: passId },
      include: { organization: true },
    });
    if (!pass) throw new NotFoundException('Pass not found');
    return pass;
  }

  /** Remaining budget on a pass */
  remaining(pass: { monthlyBudgetUsd: number; spentUsd: number }) {
    return Math.max(0, pass.monthlyBudgetUsd - pass.spentUsd);
  }

  /**
   * Charge a completed ride against a pass (Lyft Pass spend control).
   * Called when ride reaches COMPLETED.
   */
  async chargeRideToPass(rideId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride?.passId) return null;

    const pass = await this.getPassOrThrow(ride.passId);
    if (!pass.isActive) {
      throw new BadRequestException('Pass is inactive');
    }
    if (pass.validUntil && pass.validUntil < new Date()) {
      throw new BadRequestException('Pass has expired');
    }

    const amount = ride.fareEstimate ?? 0;
    if (pass.maxRideUsd != null && amount > pass.maxRideUsd) {
      throw new BadRequestException(
        `Ride fare $${amount} exceeds pass per-ride cap $${pass.maxRideUsd}`,
      );
    }

    const remaining = this.remaining(pass);
    if (amount > remaining) {
      throw new BadRequestException(
        `Insufficient pass budget (need $${amount}, remaining $${remaining.toFixed(2)})`,
      );
    }

    const updated = await this.prisma.ridePass.update({
      where: { id: pass.id },
      data: { spentUsd: { increment: amount } },
    });

    return {
      passId: updated.id,
      chargedUsd: amount,
      spentUsd: updated.spentUsd,
      remainingUsd: this.remaining(updated),
    };
  }

  async attachPassToRide(rideId: string, passId: string) {
    const pass = await this.getPassOrThrow(passId);
    if (!pass.isActive) throw new BadRequestException('Pass is inactive');

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    const amount = ride.fareEstimate ?? 0;
    if (pass.maxRideUsd != null && amount > pass.maxRideUsd) {
      throw new BadRequestException('Fare exceeds per-ride cap');
    }
    if (amount > this.remaining(pass)) {
      throw new BadRequestException('Insufficient pass budget for this fare estimate');
    }

    return this.prisma.ride.update({
      where: { id: rideId },
      data: {
        passId,
        organizationName: pass.organization.name,
      },
      include: {
        pass: { include: { organization: true } },
      },
    });
  }
}
