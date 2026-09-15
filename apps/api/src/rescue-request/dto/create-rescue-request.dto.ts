import { IsNotEmpty, IsNumber, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateRescueRequestDto {
  @IsString()
  @IsNotEmpty()
  locationAddress: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsInt()
  @Min(1)
  peopleCount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
