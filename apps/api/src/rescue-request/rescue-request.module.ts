import { Module } from '@nestjs/common';
import { RescueRequestController } from './rescue-request.controller';
import { RescueRequestService } from './rescue-request.service';

@Module({
  controllers: [RescueRequestController],
  providers: [RescueRequestService],
})
export class RescueRequestModule {}
