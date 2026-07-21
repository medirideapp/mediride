import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { DriversModule } from '../drivers/drivers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DriversModule, AuthModule],
  providers: [TrackingGateway],
})
export class TrackingModule {}
