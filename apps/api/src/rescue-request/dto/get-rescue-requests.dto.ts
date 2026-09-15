import { IsEnum, IsOptional } from 'class-validator';
import { RescueRequestPriority, RescueRequestStatus } from '@prisma/client';

export class GetRescueRequestsDto {
  @IsOptional()
  @IsEnum(RescueRequestStatus)
  status?: RescueRequestStatus;

  @IsOptional()
  @IsEnum(RescueRequestPriority)
  priority?: RescueRequestPriority;
}
