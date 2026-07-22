import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssistanceLevel, DriverStatus, RideStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConciergeRideDto, CreateRideDto } from './dto/rides.dto';
import { ACTIVE_STATUSES, canTransition } from './ride-state';

type NearestDriverRow = {
  id: string;
  user_id: string;
  distance_meters: number;
};

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  /** Haversine fallback when PostGIS raw query is unavailable */
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async findNearestDrivers(lat: number, lng: number, radiusKm = 15, limit = 10) {
    try {
      // PostGIS ST_DWithin / ST_Distance on geography (meters)
      const rows = await this.prisma.$queryRawUnsafe<NearestDriverRow[]>(
        `
        SELECT d.id, d."userId" as user_id,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(d."lastLng", d."lastLat"), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) AS distance_meters
        FROM "Driver" d
        WHERE d."isApproved" = true
          AND d.status = 'AVAILABLE'
          AND d."lastLat" IS NOT NULL
          AND d."lastLng" IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(d."lastLng", d."lastLat"), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
        ORDER BY distance_meters ASC
        LIMIT $4
        `,
        lng,
        lat,
        radiusKm * 1000,
        limit,
      );
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        distanceMeters: Number(r.distance_meters),
      }));
    } catch {
      // Fallback: in-memory haversine (works without PostGIS during early local setup)
      const drivers = await this.prisma.driver.findMany({
        where: {
          isApproved: true,
          status: DriverStatus.AVAILABLE,
          lastLat: { not: null },
          lastLng: { not: null },
        },
      });
      return drivers
        .map((d) => ({
          id: d.id,
          userId: d.userId,
          distanceMeters:
            this.haversineKm(lat, lng, d.lastLat!, d.lastLng!) * 1000,
        }))
        .filter((d) => d.distanceMeters <= radiusKm * 1000)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit);
    }
  }

  private estimateFare(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number) {
    const miles = this.haversineKm(pickupLat, pickupLng, dropLat, dropLng) * 0.621371;
    const fare = 8 + miles * 2.5; // base + per-mile NEMT-style estimate
    return { estimatedMiles: Math.round(miles * 100) / 100, fareEstimate: Math.round(fare * 100) / 100 };
  }

  private healthcareFields(dto: CreateRideDto) {
    return {
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      assistanceLevel: dto.assistanceLevel ?? AssistanceLevel.NONE,
      wheelchairNeeded: dto.wheelchairNeeded ?? false,
      ridePurpose: dto.ridePurpose,
      organizationName: dto.organizationName,
      notes: dto.notes,
    };
  }

  async requestRide(riderId: string, dto: CreateRideDto) {
    const active = await this.prisma.ride.findFirst({
      where: {
        riderId,
        status: { in: ACTIVE_STATUSES },
        scheduledFor: null,
      },
    });
    if (active && !dto.scheduledFor) {
      throw new BadRequestException('You already have an active ride');
    }

    const estimate = this.estimateFare(
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
    );

    const ride = await this.prisma.ride.create({
      data: {
        riderId,
        status: RideStatus.REQUESTED,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        ...this.healthcareFields(dto),
        ...estimate,
      },
      include: {
        rider: { select: { id: true, fullName: true, phone: true } },
      },
    });

    const nearest = await this.findNearestDrivers(dto.pickupLat, dto.pickupLng);
    return { ride, nearestDrivers: nearest };
  }

  /**
   * Lyft Concierge style: clinic/admin arranges a ride for a patient.
   * Patient does not need the app — coordinator books on their behalf.
   */
  async conciergeRide(adminUserId: string, dto: ConciergeRideDto) {
    let riderId = adminUserId;

    if (dto.riderEmail) {
      const rider = await this.prisma.user.findUnique({
        where: { email: dto.riderEmail.toLowerCase() },
      });
      if (!rider) {
        throw new NotFoundException('Rider account not found for that email');
      }
      riderId = rider.id;
    }

    const estimate = this.estimateFare(
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
    );

    const ride = await this.prisma.ride.create({
      data: {
        riderId,
        status: RideStatus.REQUESTED,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        isConcierge: true,
        bookedByUserId: adminUserId,
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        ...this.healthcareFields(dto),
        ...estimate,
      },
      include: this.rideInclude(),
    });

    const nearest = await this.findNearestDrivers(dto.pickupLat, dto.pickupLng);
    return { ride, nearestDrivers: nearest };
  }

  async acceptRide(rideId: string, userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver || !driver.isApproved) {
      throw new ForbiddenException('Driver not approved');
    }
    if (driver.status === DriverStatus.BUSY) {
      throw new BadRequestException('Driver already on a ride');
    }

    const ride = await this.getRideOrThrow(rideId);
    if (!canTransition(ride.status, RideStatus.ACCEPTED)) {
      throw new BadRequestException(`Cannot accept ride in status ${ride.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.ride.update({
        where: { id: rideId },
        data: {
          driverId: driver.id,
          status: RideStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: this.rideInclude(),
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.BUSY },
      });
      return r;
    });

    return updated;
  }

  async markArriving(rideId: string, userId: string) {
    return this.transitionAsDriver(rideId, userId, RideStatus.ARRIVING, {
      arrivingAt: new Date(),
    });
  }

  async confirmStart(rideId: string, userId: string, role: Role) {
    const ride = await this.getRideOrThrow(rideId);
    this.assertParticipant(ride, userId, role);

    const data =
      role === Role.DRIVER
        ? { driverConfirmedStart: true }
        : { riderConfirmedStart: true };

    let updated = await this.prisma.ride.update({
      where: { id: rideId },
      data,
      include: this.rideInclude(),
    });

    // Both parties confirm → move to IN_PROGRESS
    if (
      updated.riderConfirmedStart &&
      updated.driverConfirmedStart &&
      canTransition(updated.status, RideStatus.IN_PROGRESS)
    ) {
      updated = await this.prisma.ride.update({
        where: { id: rideId },
        data: { status: RideStatus.IN_PROGRESS, startedAt: new Date() },
        include: this.rideInclude(),
      });
    }

    return updated;
  }

  async confirmStop(rideId: string, userId: string, role: Role) {
    const ride = await this.getRideOrThrow(rideId);
    this.assertParticipant(ride, userId, role);

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('Ride must be in progress to stop');
    }

    const data =
      role === Role.DRIVER
        ? { driverConfirmedStop: true }
        : { riderConfirmedStop: true };

    let updated = await this.prisma.ride.update({
      where: { id: rideId },
      data,
      include: this.rideInclude(),
    });

    if (updated.riderConfirmedStop && updated.driverConfirmedStop) {
      updated = await this.prisma.$transaction(async (tx) => {
        const r = await tx.ride.update({
          where: { id: rideId },
          data: { status: RideStatus.COMPLETED, completedAt: new Date() },
          include: this.rideInclude(),
        });
        if (r.driverId) {
          await tx.driver.update({
            where: { id: r.driverId },
            data: { status: DriverStatus.AVAILABLE },
          });
        }
        return r;
      });
    }

    return updated;
  }

  async cancelRide(rideId: string, userId: string, role: Role, reason?: string) {
    const ride = await this.getRideOrThrow(rideId);
    this.assertParticipant(ride, userId, role);

    if (!canTransition(ride.status, RideStatus.CANCELLED)) {
      throw new BadRequestException(`Cannot cancel ride in status ${ride.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const r = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason,
        },
        include: this.rideInclude(),
      });
      if (r.driverId) {
        await tx.driver.update({
          where: { id: r.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }
      return r;
    });
  }

  async getRide(rideId: string, userId: string, role: Role) {
    const ride = await this.getRideOrThrow(rideId);
    if (role !== Role.ADMIN) {
      this.assertParticipant(ride, userId, role);
    }
    return ride;
  }

  async listMyRides(userId: string, role: Role) {
    if (role === Role.DRIVER) {
      const driver = await this.prisma.driver.findUnique({ where: { userId } });
      if (!driver) return [];
      return this.prisma.ride.findMany({
        where: { driverId: driver.id },
        orderBy: { createdAt: 'desc' },
        include: this.rideInclude(),
        take: 50,
      });
    }
    return this.prisma.ride.findMany({
      where: { riderId: userId },
      orderBy: { createdAt: 'desc' },
      include: this.rideInclude(),
      take: 50,
    });
  }

  async listOpenRequests(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver?.isApproved) {
      throw new ForbiddenException('Driver not approved');
    }
    return this.prisma.ride.findMany({
      where: { status: RideStatus.REQUESTED, driverId: null },
      orderBy: { requestedAt: 'asc' },
      include: this.rideInclude(),
      take: 20,
    });
  }

  private async transitionAsDriver(
    rideId: string,
    userId: string,
    to: RideStatus,
    extra: Record<string, Date>,
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException();
    const ride = await this.getRideOrThrow(rideId);
    if (ride.driverId !== driver.id) throw new ForbiddenException();
    if (!canTransition(ride.status, to)) {
      throw new BadRequestException(`Cannot transition ${ride.status} → ${to}`);
    }
    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: to, ...extra },
      include: this.rideInclude(),
    });
  }

  private async getRideOrThrow(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: this.rideInclude(),
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  private assertParticipant(
    ride: { riderId: string; driver?: { userId: string } | null },
    userId: string,
    role: Role,
  ) {
    if (role === Role.ADMIN) return;
    if (role === Role.RIDER && ride.riderId === userId) return;
    if (role === Role.DRIVER && ride.driver?.userId === userId) return;
    // Driver may not be loaded with userId in some includes
    if (role === Role.DRIVER) {
      // allow if we'll check via driverId elsewhere
    }
    if (ride.riderId !== userId && ride.driver?.userId !== userId) {
      throw new ForbiddenException('Not a participant of this ride');
    }
  }

  private rideInclude() {
    return {
      rider: { select: { id: true, fullName: true, phone: true, email: true } },
      driver: {
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
          vehicle: true,
        },
      },
    } as const;
  }
}
