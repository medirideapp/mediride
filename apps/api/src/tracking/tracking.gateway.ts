import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { DriversService } from '../drivers/drivers.service';

type LocPayload = {
  rideId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
};

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/tracking',
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private drivers: DriversService,
  ) {}

  async afterInit(server: Server) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const pub = new Redis(redisUrl);
        const sub = pub.duplicate();
        server.adapter(createAdapter(pub, sub) as never);
        this.logger.log('Socket.IO Redis adapter attached');
      } catch (err) {
        this.logger.warn(`Redis adapter unavailable, using in-memory: ${err}`);
      }
    } else {
      this.logger.warn('REDIS_URL not set — using in-memory Socket.IO adapter');
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = this.jwt.verify<{ sub: string; role: string; email: string }>(token);
      client.data.user = {
        userId: payload.sub,
        role: payload.role,
        email: payload.email,
      };
      this.logger.debug(`WS connected: ${payload.email}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_ride')
  async joinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { rideId: string },
  ) {
    const user = client.data.user;
    if (!user || !body?.rideId) return { ok: false };

    const ride = await this.prisma.ride.findUnique({
      where: { id: body.rideId },
      include: { driver: true },
    });
    if (!ride) return { ok: false, error: 'not_found' };

    const isRider = ride.riderId === user.userId;
    const isDriver = ride.driver?.userId === user.userId;
    const isAdmin = user.role === 'ADMIN';
    if (!isRider && !isDriver && !isAdmin) {
      return { ok: false, error: 'forbidden' };
    }

    await client.join(`ride:${body.rideId}`);
    return { ok: true, room: `ride:${body.rideId}` };
  }

  @SubscribeMessage('driver_location')
  async driverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: LocPayload,
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'DRIVER') return { ok: false };
    if (!body?.rideId || typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      return { ok: false, error: 'invalid' };
    }

    // Persist last known driver location
    await this.drivers.updateLocation(user.userId, { lat: body.lat, lng: body.lng });

    const driver = await this.prisma.driver.findUnique({ where: { userId: user.userId } });
    if (driver) {
      await this.prisma.locationPing.create({
        data: {
          rideId: body.rideId,
          driverId: driver.id,
          lat: body.lat,
          lng: body.lng,
          heading: body.heading,
          speed: body.speed,
        },
      });
    }

    const payload = {
      rideId: body.rideId,
      lat: body.lat,
      lng: body.lng,
      heading: body.heading,
      speed: body.speed,
      at: new Date().toISOString(),
    };

    this.server.to(`ride:${body.rideId}`).emit('location_update', payload);
    return { ok: true };
  }

  @SubscribeMessage('ride_event')
  async rideEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { rideId: string; event: string; data?: unknown },
  ) {
    if (!body?.rideId || !body?.event) return { ok: false };
    this.server.to(`ride:${body.rideId}`).emit('ride_event', {
      rideId: body.rideId,
      event: body.event,
      data: body.data,
      at: new Date().toISOString(),
    });
    return { ok: true };
  }
}
