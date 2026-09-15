import { IsEnum } from 'class-validator';
import { RescueRequestPriority } from '@prisma/client';

export class PrioritizeRescueRequestDto {
  @IsEnum(RescueRequestPriority)
  priority: RescueRequestPriority;
}
