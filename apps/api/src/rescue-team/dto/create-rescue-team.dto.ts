import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { RescueTeamStatus } from '@prisma/client';

export class CreateRescueTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(RescueTeamStatus)
  status?: RescueTeamStatus;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  capability?: string;
}
