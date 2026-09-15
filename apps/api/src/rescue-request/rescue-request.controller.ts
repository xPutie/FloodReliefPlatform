import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RescueRequestService } from './rescue-request.service';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { UpdateRescueRequestDto } from './dto/update-rescue-request.dto';
import { GetRescueRequestsDto } from './dto/get-rescue-requests.dto';
import { VerifyRescueRequestDto } from './dto/verify-rescue-request.dto';
import { PrioritizeRescueRequestDto } from './dto/prioritize-rescue-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rescue-requests')
export class RescueRequestController {
  constructor(private readonly rescueRequestService: RescueRequestService) {}

  // PUBLIC OR WORKSPACE QUERY
  @Get()
  findAll(@Query() query: GetRescueRequestsDto) {
    return this.rescueRequestService.findAll(query);
  }

  // PUBLIC: Citizen request tracking by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rescueRequestService.findOne(id);
  }

  // PUBLIC: Citizen emergency rescue request submission
  @Post()
  create(@Body() createRescueRequestDto: CreateRescueRequestDto) {
    return this.rescueRequestService.create(createRescueRequestDto);
  }

  // PROTECTED: Update rescue request details (COORDINATOR, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRescueRequestDto: UpdateRescueRequestDto,
  ) {
    return this.rescueRequestService.update(id, updateRescueRequestDto);
  }

  // PROTECTED: Verify rescue request (COORDINATOR, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() verifyRescueRequestDto: VerifyRescueRequestDto,
    @Request() req: any,
  ) {
    return this.rescueRequestService.verify(id, verifyRescueRequestDto, req.user?.id);
  }

  // PROTECTED: Prioritize rescue request (COORDINATOR, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Patch(':id/prioritize')
  prioritize(
    @Param('id') id: string,
    @Body() prioritizeRescueRequestDto: PrioritizeRescueRequestDto,
    @Request() req: any,
  ) {
    return this.rescueRequestService.prioritize(id, prioritizeRescueRequestDto, req.user?.id);
  }
}



