import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { RescueTeamService } from './rescue-team.service';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';
import { UpdateTeamLocationDto } from './dto/update-team-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('rescue-teams')
export class RescueTeamController {
  constructor(private readonly rescueTeamService: RescueTeamService) {}

  @Post()
  create(@Body() createRescueTeamDto: CreateRescueTeamDto) {
    return this.rescueTeamService.create(createRescueTeamDto);
  }

  @Get()
  findAll() {
    return this.rescueTeamService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.rescueTeamService.findAvailable();
  }

  // PROTECTED: Get active team locations for Coordinator & Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Get('locations')
  getActiveLocations() {
    return this.rescueTeamService.getActiveLocations();
  }

  // PROTECTED: Authenticated team member location update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_MEMBER', 'ADMIN')
  @Patch('me/location')
  updateMyLocation(
    @GetUser() user: { id: string },
    @Body() dto: UpdateTeamLocationDto,
  ) {
    return this.rescueTeamService.updateLocation(
      user.id,
      dto.latitude,
      dto.longitude,
      dto.accuracy,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rescueTeamService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRescueTeamDto: UpdateRescueTeamDto,
  ) {
    return this.rescueTeamService.update(id, updateRescueTeamDto);
  }
}
