import { Module } from '@nestjs/common';
import { RescueTeamController } from './rescue-team.controller';
import { RescueTeamService } from './rescue-team.service';

@Module({
  controllers: [RescueTeamController],
  providers: [RescueTeamService],
  exports: [RescueTeamService],
})
export class RescueTeamModule {}
