import { Module, forwardRef } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [forwardRef(() => OrganizationsModule)],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
