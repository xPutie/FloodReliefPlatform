import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, RescueRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { UpdateRescueRequestDto } from './dto/update-rescue-request.dto';
import { GetRescueRequestsDto } from './dto/get-rescue-requests.dto';
import { VerifyRescueRequestDto, VerifyDecision } from './dto/verify-rescue-request.dto';
import { PrioritizeRescueRequestDto } from './dto/prioritize-rescue-request.dto';

// Standard 36-character UUID development requester ID strategy (before Auth module is implemented)
const DEV_CITIZEN_USER_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class RescueRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query?: GetRescueRequestsDto) {
    const where: Prisma.RescueRequestWhereInput = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.priority) {
      where.priority = query.priority;
    }

    return this.prisma.rescueRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        requesterId: true,
        locationAddress: true,
        latitude: true,
        longitude: true,
        peopleCount: true,
        description: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const rescueRequest = await this.prisma.rescueRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requesterId: true,
        locationAddress: true,
        latitude: true,
        longitude: true,
        peopleCount: true,
        description: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rescueRequest) {
      throw new NotFoundException(`Rescue request with ID "${id}" not found`);
    }

    return rescueRequest;
  }

  async update(id: string, dto: UpdateRescueRequestDto) {
    // Verify existence first
    await this.findOne(id);

    return this.prisma.rescueRequest.update({
      where: { id },
      data: {
        locationAddress: dto.locationAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        peopleCount: dto.peopleCount,
        description: dto.description,
      },
    });
  }

  async verify(id: string, dto: VerifyRescueRequestDto, userId?: string) {
    const rescueRequest = await this.findOne(id);

    if (rescueRequest.status !== RescueRequestStatus.CREATED) {
      throw new BadRequestException(
        `Only requests in CREATED status can be verified. Current status is ${rescueRequest.status}`,
      );
    }

    const targetStatus =
      dto.decision === VerifyDecision.VERIFY
        ? RescueRequestStatus.VERIFIED
        : RescueRequestStatus.INVALID;

    const updated = await this.prisma.rescueRequest.update({
      where: { id },
      data: {
        status: targetStatus,
      },
    });

    await this.auditService.log(
      userId || null,
      dto.decision === VerifyDecision.VERIFY ? 'REQUEST_VERIFIED' : 'REQUEST_INVALIDATED',
      'RescueRequest',
      id,
      { decision: dto.decision, status: targetStatus },
    );

    return updated;
  }

  async prioritize(id: string, dto: PrioritizeRescueRequestDto, userId?: string) {
    const rescueRequest = await this.findOne(id);

    if (rescueRequest.status !== RescueRequestStatus.VERIFIED) {
      throw new BadRequestException(
        `Only requests in VERIFIED status can be prioritized. Current status is ${rescueRequest.status}`,
      );
    }

    const updated = await this.prisma.rescueRequest.update({
      where: { id },
      data: {
        priority: dto.priority,
        status: RescueRequestStatus.PRIORITIZED,
      },
    });

    await this.auditService.log(
      userId || null,
      'REQUEST_PRIORITIZED',
      'RescueRequest',
      id,
      { priority: dto.priority },
    );

    return updated;
  }

  async create(dto: CreateRescueRequestDto) {
    // Ensure standard development requester user exists in database to satisfy foreign key constraint
    const devUser = await this.prisma.user.upsert({
      where: { id: DEV_CITIZEN_USER_ID },
      update: {},
      create: {
        id: DEV_CITIZEN_USER_ID,
        name: 'Development Citizen',
        phone: '0900000000',
        email: 'dev.citizen@example.com',
        password: 'hashed_dev_password',
        role: 'CITIZEN',
      },
    });

    return this.prisma.rescueRequest.create({
      data: {
        requesterId: devUser.id,
        locationAddress: dto.locationAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        peopleCount: dto.peopleCount,
        description: dto.description,
        status: 'CREATED',
        priority: null,
      },
    });
  }
}
