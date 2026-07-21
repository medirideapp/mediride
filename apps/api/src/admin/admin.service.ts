import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  listRides(status?: string) {
    return this.prisma.ride.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        rider: { select: { id: true, fullName: true, email: true, phone: true } },
        driver: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
            vehicle: true,
          },
        },
      },
    });
  }

  listDrivers() {
    return this.prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        vehicle: true,
      },
    });
  }

  async approveDriver(driverId: string, approved: boolean) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { isApproved: approved },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        vehicle: true,
      },
    });
  }

  stats() {
    return Promise.all([
      this.prisma.ride.count(),
      this.prisma.ride.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ride.count({ where: { status: 'COMPLETED' } }),
      this.prisma.driver.count({ where: { isApproved: true } }),
      this.prisma.driver.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.user.count({ where: { role: 'RIDER' } }),
    ]).then(([rides, active, completed, approvedDrivers, onlineDrivers, riders]) => ({
      rides,
      active,
      completed,
      approvedDrivers,
      onlineDrivers,
      riders,
    }));
  }
}
