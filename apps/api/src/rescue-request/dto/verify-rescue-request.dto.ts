import { IsEnum } from 'class-validator';

export enum VerifyDecision {
  VERIFY = 'VERIFY',
  INVALID = 'INVALID',
}

export class VerifyRescueRequestDto {
  @IsEnum(VerifyDecision)
  decision: VerifyDecision;
}
