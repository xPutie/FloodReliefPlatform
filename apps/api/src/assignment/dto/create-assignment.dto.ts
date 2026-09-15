import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  rescueRequestId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  rescueTeamId: string;
}
