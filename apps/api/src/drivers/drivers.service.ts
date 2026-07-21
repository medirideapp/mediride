import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DriverStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto, UpsertVehicleDto } from './dto/drivers.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true, user: { select: { id: true, fullName: true, email: true, phone: true } } },
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async setStatus(userId: string, status: DriverStatus) {
    const driver = await this.getProfile(userId);
    if (!driver.isApproved && status === DriverStatus.AVAILABLE) {
      throw new ForbiddenException('Driver must be approved before going online');
    }
    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { status },
      include: { vehicle: true },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const driver = await this.getProfile(userId);
    return this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastLocationAt: new Date(),
      },
    });
  }

  async upsertVehicle(userId: string, dto: UpsertVehicleDto) {
    const driver = await this.getProfile(userId);
    return this.prisma.vehicle.upsert({
      where: { driverId: driver.id },
      create: { driverId: driver.id, ...dto },
      update: dto,
    });
  }
}
