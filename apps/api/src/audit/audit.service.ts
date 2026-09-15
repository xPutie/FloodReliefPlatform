import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null = null,
    metadata: Record<string, any> | null = null,
  ) {
    try {
      // Clean sensitive properties from metadata if any
      let sanitizedMetadata = metadata;
      if (metadata) {
        const { password, passwordHash, token, accessToken, ...clean } = metadata;
        sanitizedMetadata = clean;
      }

      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata: sanitizedMetadata ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record audit log [${action}]:`, error);
      // Non-blocking: Audit failure should not crash main transaction unless required
    }
  }

  async getLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.userId) where.userId = params.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportCsv(): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    const headers = ['Timestamp', 'User Name', 'User Role', 'Action', 'Entity Type', 'Entity ID'];
    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.user?.name || 'System / Unauthenticated',
      log.user?.role || 'N/A',
      log.action,
      log.entityType,
      log.entityId || '',
    ]);

    const formatCell = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvContent = [
      headers.map(formatCell).join(','),
      ...rows.map((row) => row.map((cell) => formatCell(String(cell))).join(',')),
    ].join('\r\n');

    return csvContent;
  }
}
