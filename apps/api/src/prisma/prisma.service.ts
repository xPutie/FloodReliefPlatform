import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Successfully connected to MySQL database via Prisma.');
    } catch (error) {
      this.logger.warn('MySQL database connection unavailable on startup. Service will operate in offline/degraded mode.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from MySQL database.');
    } catch (error) {
      // Ignore disconnect errors on shutdown
    }
  }
}
