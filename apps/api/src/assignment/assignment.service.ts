import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AssignmentStatus, RescueRequestStatus, RescueTeamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { RespondAssignmentDto, TeamResponseDecision } from './dto/respond-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAssignmentDto, userId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.rescueRequest.findUnique({
        where: { id: dto.rescueRequestId },
      });
      if (!request) {
        throw new NotFoundException(
          `RescueRequest with ID "${dto.rescueRequestId}" not found`,
        );
      }

      const team = await tx.rescueTeam.findUnique({
        where: { id: dto.rescueTeamId },
      });
      if (!team) {
        throw new NotFoundException(
          `RescueTeam with ID "${dto.rescueTeamId}" not found`,
        );
      }

      if (request.status !== RescueRequestStatus.PRIORITIZED && request.status !== RescueRequestStatus.WAITING_FOR_TEAM) {
        throw new ConflictException(
          `Yêu cầu cứu hộ này đã được phân công hoặc hoàn thành (Trạng thái hiện tại: ${request.status}).`,
        );
      }

      if (team.status !== RescueTeamStatus.AVAILABLE) {
        throw new ConflictException(
          `Đội cứu hộ "${team.name}" vừa được phân công cho nhiệm vụ khác hoặc đang ngoại tuyến.`,
        );
      }

      const activeAssignment = await tx.assignment.findFirst({
        where: {
          OR: [
            { rescueRequestId: dto.rescueRequestId },
            { rescueTeamId: dto.rescueTeamId },
          ],
          status: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
          },
        },
      });

      if (activeAssignment) {
        throw new ConflictException(
          `Yêu cầu hoặc Đội cứu hộ này đã có nhiệm vụ đang triển khai.`,
        );
      }

      await tx.rescueRequest.update({
        where: { id: dto.rescueRequestId },
        data: { status: RescueRequestStatus.ASSIGNED },
      });

      await tx.rescueTeam.update({
        where: { id: dto.rescueTeamId },
        data: { status: RescueTeamStatus.ON_MISSION },
      });

      return tx.assignment.create({
        data: {
          rescueRequestId: dto.rescueRequestId,
          rescueTeamId: dto.rescueTeamId,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
        },
        include: {
          rescueRequest: true,
          rescueTeam: true,
        },
      });
    });

    await this.auditService.log(
      userId || null,
      'ASSIGNMENT_CREATED',
      'Assignment',
      result.id,
      {
        rescueRequestId: dto.rescueRequestId,
        rescueTeamId: dto.rescueTeamId,
        teamName: result.rescueTeam.name,
      },
    );

    return result;
  }

  async respond(id: string, dto: RespondAssignmentDto, userId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID "${id}" not found`);
      }

      if (assignment.status !== AssignmentStatus.ASSIGNED) {
        throw new BadRequestException(
          `Nhiệm vụ phải ở trạng thái ASSIGNED để phản hồi. Trạng thái hiện tại: ${assignment.status}`,
        );
      }

      if (dto.decision === TeamResponseDecision.ACCEPT) {
        await tx.rescueRequest.update({
          where: { id: assignment.rescueRequestId },
          data: { status: RescueRequestStatus.ACCEPTED },
        });

        return tx.assignment.update({
          where: { id },
          data: {
            status: AssignmentStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
          include: {
            rescueRequest: true,
            rescueTeam: true,
          },
        });
      } else {
        // REJECT
        await tx.rescueRequest.update({
          where: { id: assignment.rescueRequestId },
          data: { status: RescueRequestStatus.WAITING_FOR_TEAM },
        });

        await tx.rescueTeam.update({
          where: { id: assignment.rescueTeamId },
          data: { status: RescueTeamStatus.AVAILABLE },
        });

        return tx.assignment.update({
          where: { id },
          data: {
            status: AssignmentStatus.REJECTED,
            rejectedAt: new Date(),
          },
          include: {
            rescueRequest: true,
            rescueTeam: true,
          },
        });
      }
    });

    await this.auditService.log(
      userId || null,
      dto.decision === TeamResponseDecision.ACCEPT
        ? 'ASSIGNMENT_ACCEPTED'
        : 'ASSIGNMENT_REJECTED',
      'Assignment',
      id,
      { decision: dto.decision },
    );

    return result;
  }

  async start(id: string, userId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID "${id}" not found`);
      }

      if (assignment.status !== AssignmentStatus.ACCEPTED) {
        throw new BadRequestException(
          `Nhiệm vụ phải ở trạng thái ACCEPTED để bắt đầu. Trạng thái hiện tại: ${assignment.status}`,
        );
      }

      await tx.rescueRequest.update({
        where: { id: assignment.rescueRequestId },
        data: { status: RescueRequestStatus.IN_PROGRESS },
      });

      return tx.assignment.update({
        where: { id },
        data: {
          startedAt: new Date(),
        },
        include: {
          rescueRequest: true,
          rescueTeam: true,
        },
      });
    });

    await this.auditService.log(
      userId || null,
      'MISSION_STARTED',
      'Assignment',
      id,
      { rescueRequestId: result?.rescueRequestId },
    );

    return result;
  }

  async complete(id: string, userId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID "${id}" not found`);
      }

      if (assignment.status !== AssignmentStatus.ACCEPTED) {
        throw new BadRequestException(
          `Nhiệm vụ phải ở trạng thái ACCEPTED/IN_PROGRESS để hoàn thành. Trạng thái hiện tại: ${assignment.status}`,
        );
      }

      await tx.rescueRequest.update({
        where: { id: assignment.rescueRequestId },
        data: { status: RescueRequestStatus.COMPLETED },
      });

      await tx.rescueTeam.update({
        where: { id: assignment.rescueTeamId },
        data: { status: RescueTeamStatus.AVAILABLE },
      });

      return tx.assignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          rescueRequest: true,
          rescueTeam: true,
        },
      });
    });

    await this.auditService.log(
      userId || null,
      'MISSION_COMPLETED',
      'Assignment',
      id,
      { rescueRequestId: result.rescueRequestId },
    );

    return result;
  }

  async fail(id: string, userId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID "${id}" not found`);
      }

      if (assignment.status !== AssignmentStatus.ACCEPTED) {
        throw new BadRequestException(
          `Nhiệm vụ phải ở trạng thái ACCEPTED/IN_PROGRESS để báo thất bại. Trạng thái hiện tại: ${assignment.status}`,
        );
      }

      await tx.rescueRequest.update({
        where: { id: assignment.rescueRequestId },
        data: { status: RescueRequestStatus.RESCUE_FAILED },
      });

      await tx.rescueTeam.update({
        where: { id: assignment.rescueTeamId },
        data: { status: RescueTeamStatus.AVAILABLE },
      });

      return tx.assignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.FAILED,
          failedAt: new Date(),
        },
        include: {
          rescueRequest: true,
          rescueTeam: true,
        },
      });
    });

    await this.auditService.log(
      userId || null,
      'MISSION_FAILED',
      'Assignment',
      id,
      { rescueRequestId: result.rescueRequestId },
    );

    return result;
  }

  async findAll() {
    return this.prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        rescueRequest: true,
        rescueTeam: true,
      },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        rescueRequest: true,
        rescueTeam: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID "${id}" not found`);
    }

    return assignment;
  }
}
