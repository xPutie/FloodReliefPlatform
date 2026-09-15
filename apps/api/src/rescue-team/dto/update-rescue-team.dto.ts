import { PartialType } from '@nestjs/mapped-types';
import { CreateRescueTeamDto } from './create-rescue-team.dto';

export class UpdateRescueTeamDto extends PartialType(CreateRescueTeamDto) {}
