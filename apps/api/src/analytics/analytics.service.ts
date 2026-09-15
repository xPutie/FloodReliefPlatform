import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      reqCounts,
      reqPriorities,
      teamCounts,
      assignments,
      allRequestsWithAssignments,
    ] = await Promise.all([
      // 1. Request counts by status
      this.prisma.rescueRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 2. Request counts by priority
      this.prisma.rescueRequest.groupBy({
        by: ['priority'],
        _count: { _all: true },
      }),
      // 3. Team counts by status
      this.prisma.rescueTeam.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 4. Mission (Assignment) counts by status
      this.prisma.assignment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 5. Query assignments with related request to compute assignment time & duration
      this.prisma.assignment.findMany({
        select: {
          assignedAt: true,
          acceptedAt: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          rescueRequest: {
            select: { createdAt: true },
          },
        },
      }),
    ]);

    // Build structured request status stats
    const requestStatusMap: Record<string, number> = {};
    let totalRequests = 0;
    reqCounts.forEach((c) => {
      requestStatusMap[c.status] = c._count._all;
      totalRequests += c._count._all;
    });

    const requests = {
      total: totalRequests,
      pending:
        (requestStatusMap['CREATED'] || 0) +
        (requestStatusMap['VERIFYING'] || 0) +
        (requestStatusMap['WAITING_FOR_TEAM'] || 0),
      verified: requestStatusMap['VERIFIED'] || 0,
      prioritized: requestStatusMap['PRIORITIZED'] || 0,
      assigned: requestStatusMap['ASSIGNED'] || 0,
      completed: requestStatusMap['COMPLETED'] || 0,
      failed: requestStatusMap['RESCUE_FAILED'] || 0,
    };

    // Build priority stats
    const priorityMap: Record<string, number> = {};
    reqPriorities.forEach((p) => {
      if (p.priority) {
        priorityMap[p.priority] = p._count._all;
      }
    });

    const priority = {
      critical: priorityMap['CRITICAL'] || 0,
      high: priorityMap['HIGH'] || 0,
      medium: priorityMap['MEDIUM'] || 0,
      low: priorityMap['LOW'] || 0,
    };

    // Build team stats
    const teamMap: Record<string, number> = {};
    let totalTeams = 0;
    teamCounts.forEach((t) => {
      teamMap[t.status] = t._count._all;
      totalTeams += t._count._all;
    });

    const teams = {
      total: totalTeams,
      available: teamMap['AVAILABLE'] || 0,
      onMission: teamMap['ON_MISSION'] || 0,
      offline: teamMap['OFFLINE'] || 0,
    };

    // Build mission stats
    const missionMap: Record<string, number> = {};
    let totalMissions = 0;
    assignments.forEach((a) => {
      missionMap[a.status] = a._count._all;
      totalMissions += a._count._all;
    });

    const missions = {
      total: totalMissions,
      active: (missionMap['ASSIGNED'] || 0) + (missionMap['ACCEPTED'] || 0),
      completed: missionMap['COMPLETED'] || 0,
      failed: missionMap['FAILED'] || 0,
    };

    // Calculate Performance Metrics safely
    // A. Time to Assignment: request.createdAt -> assignment.assignedAt
    const assignmentTimes: number[] = [];
    // B. Mission Duration: assignment.startedAt -> assignment.completedAt (Strict business timestamps)
    const missionDurations: number[] = [];

    allRequestsWithAssignments.forEach((assign) => {
      if (assign.rescueRequest?.createdAt && assign.assignedAt) {
        const reqCreated = new Date(assign.rescueRequest.createdAt).getTime();
        const assigned = new Date(assign.assignedAt).getTime();
        if (assigned >= reqCreated) {
          assignmentTimes.push((assigned - reqCreated) / (1000 * 60)); // minutes
        }
      }

      if (assign.status === 'COMPLETED' && assign.startedAt && assign.completedAt) {
        const start = new Date(assign.startedAt).getTime();
        const end = new Date(assign.completedAt).getTime();
        if (end >= start) {
          missionDurations.push((end - start) / (1000 * 60)); // minutes
        }
      }
    });

    const averageAssignmentTimeMinutes =
      assignmentTimes.length > 0
        ? Math.round(assignmentTimes.reduce((a, b) => a + b, 0) / assignmentTimes.length)
        : null;

    const averageMissionDurationMinutes =
      missionDurations.length > 0
        ? Math.round(missionDurations.reduce((a, b) => a + b, 0) / missionDurations.length)
        : null;

    return {
      requests,
      priority,
      teams,
      missions,
      performance: {
        averageAssignmentTimeMinutes,
        averageMissionDurationMinutes,
      },
    };
  }

  async getGeography() {
    const requests = await this.prisma.rescueRequest.findMany({
      select: {
        id: true,
        priority: true,
        status: true,
        latitude: true,
        longitude: true,
        locationAddress: true,
      },
    });

    let withGpsCount = 0;
    let withoutGpsCount = 0;

    let sumLat = 0;
    let sumLng = 0;
    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    const points: Array<{
      id: string;
      latitude: number;
      longitude: number;
      priority: string | null;
      status: string;
      locationAddress: string;
    }> = [];

    requests.forEach((r) => {
      if (r.latitude !== null && r.longitude !== null) {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          withGpsCount++;
          sumLat += lat;
          sumLng += lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;

          points.push({
            id: r.id,
            latitude: lat,
            longitude: lng,
            priority: r.priority,
            status: r.status,
            locationAddress: r.locationAddress,
          });
        } else {
          withoutGpsCount++;
        }
      } else {
        withoutGpsCount++;
      }
    });

    const center =
      withGpsCount > 0
        ? { latitude: sumLat / withGpsCount, longitude: sumLng / withGpsCount }
        : null;

    const boundingBox =
      withGpsCount > 0
        ? { minLat, maxLat, minLng, maxLng }
        : null;

    return {
      total: requests.length,
      withGpsCount,
      withoutGpsCount,
      center,
      boundingBox,
      points,
    };
  }

  async exportRescueRequestsCsv(): Promise<string> {
    const requests = await this.prisma.rescueRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            rescueTeam: {
              select: { name: true },
            },
          },
        },
      },
    });

    const headers = [
      'Request ID',
      'Created At',
      'Priority',
      'Status',
      'Location Address',
      'Latitude',
      'Longitude',
      'Assigned Team',
      'Assignment Status',
      'Completed At',
    ];

    const rows = requests.map((r) => {
      const latestAssignment = r.assignments[0];
      const completedAt =
        r.status === 'COMPLETED' && latestAssignment?.updatedAt
          ? latestAssignment.updatedAt.toISOString()
          : '';

      return [
        r.id,
        r.createdAt.toISOString(),
        r.priority || '',
        r.status,
        r.locationAddress,
        r.latitude !== null ? String(r.latitude) : '',
        r.longitude !== null ? String(r.longitude) : '',
        latestAssignment?.rescueTeam?.name || '',
        latestAssignment?.status || '',
        completedAt,
      ];
    });

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
