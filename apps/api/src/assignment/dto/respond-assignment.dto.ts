import { IsEnum } from 'class-validator';

export enum TeamResponseDecision {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class RespondAssignmentDto {
  @IsEnum(TeamResponseDecision)
  decision: TeamResponseDecision;
}
