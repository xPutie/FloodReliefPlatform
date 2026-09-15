import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { RespondAssignmentDto } from './dto/respond-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // PROTECTED: Create assignment (COORDINATOR, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Post()
  create(@Body() createAssignmentDto: CreateAssignmentDto, @Request() req: any) {
    return this.assignmentService.create(createAssignmentDto, req.user?.id);
  }

  @Get()
  findAll() {
    return this.assignmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(id);
  }

  // PROTECTED: Respond to assignment (TEAM_MEMBER, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_MEMBER', 'ADMIN')
  @Patch(':id/respond')
  respond(
    @Param('id') id: string,
    @Body() respondAssignmentDto: RespondAssignmentDto,
    @Request() req: any,
  ) {
    return this.assignmentService.respond(id, respondAssignmentDto, req.user?.id);
  }

  // PROTECTED: Start mission (TEAM_MEMBER, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_MEMBER', 'ADMIN')
  @Patch(':id/start')
  start(@Param('id') id: string, @Request() req: any) {
    return this.assignmentService.start(id, req.user?.id);
  }

  // PROTECTED: Complete mission (TEAM_MEMBER, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_MEMBER', 'ADMIN')
  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.assignmentService.complete(id, req.user?.id);
  }

  // PROTECTED: Fail mission (TEAM_MEMBER, ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_MEMBER', 'ADMIN')
  @Patch(':id/fail')
  fail(@Param('id') id: string, @Request() req: any) {
    return this.assignmentService.fail(id, req.user?.id);
  }
}
