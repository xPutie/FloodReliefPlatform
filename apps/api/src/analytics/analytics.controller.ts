import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('geography')
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  async getGeography() {
    return this.analyticsService.getGeography();
  }

  @Get('export/rescue-requests')
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  async exportRescueRequests(@Res() res: Response) {
    const csvData = await this.analyticsService.exportRescueRequestsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rescue_requests_report.csv"');
    return res.send(csvData);
  }
}
