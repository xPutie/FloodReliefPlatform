import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    // Verify connection with a lightweight query
    try {
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Successfully connected to MySQL database via Prisma.');
    } catch (error) {
      this.logger.error('Failed to connect to MySQL database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from MySQL database.');
  }
}
