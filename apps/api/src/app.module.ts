import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RescueRequestModule } from './rescue-request/rescue-request.module';
import { RescueTeamModule } from './rescue-team/rescue-team.module';
import { AssignmentModule } from './assignment/assignment.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    AuditModule,
    AnalyticsModule,
    RescueRequestModule,
    RescueTeamModule,
    AssignmentModule,
    AuthModule,
  ],
})
export class AppModule {}
