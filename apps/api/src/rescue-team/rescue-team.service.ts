import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RescueTeamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';

@Injectable()
export class RescueTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRescueTeamDto) {
    return this.prisma.rescueTeam.create({
      data: {
        name: dto.name,
        status: dto.status ?? RescueTeamStatus.AVAILABLE,
        capacity: dto.capacity,
        capability: dto.capability,
      },
    });
  }

  async findAll() {
    return this.prisma.rescueTeam.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAvailable() {
    return this.prisma.rescueTeam.findMany({
      where: {
        status: RescueTeamStatus.AVAILABLE,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const team = await this.prisma.rescueTeam.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Rescue team with ID "${id}" not found`);
    }

    return team;
  }

  async update(id: string, dto: UpdateRescueTeamDto) {
    // Verify existence first
    await this.findOne(id);

    return this.prisma.rescueTeam.update({
      where: { id },
      data: dto,
    });
  }

  async updateLocation(teamId: string, latitude: number, longitude: number, accuracy?: number) {
    // 1. Boundary check
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Tọa độ GPS không hợp lệ (Latitude/Longitude vượt khoảng cho phép).');
    }

    const team = await this.findOne(teamId);
    const now = new Date();

    // 2. Anomaly Check: Teleportation / Implausible speed check
    if (team.currentLatitude !== null && team.currentLongitude !== null && team.locationUpdatedAt !== null) {
      const prevLat = Number(team.currentLatitude);
      const prevLng = Number(team.currentLongitude);
      const prevTime = new Date(team.locationUpdatedAt).getTime();
      const elapsedSeconds = (now.getTime() - prevTime) / 1000;

      if (elapsedSeconds > 0 && elapsedSeconds < 300) { // Check within 5 minutes delta
        // Haversine distance in meters
        const R = 6371000; // meters
        const dLat = ((latitude - prevLat) * Math.PI) / 180;
        const dLon = ((longitude - prevLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prevLat * Math.PI) / 180) *
            Math.cos((latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceMeters = R * c;
        const speedMps = distanceMeters / elapsedSeconds; // m/s

        // If speed > 100 m/s (~360 km/h) over a short interval, flag suspicious GPS
        if (speedMps > 100) {
          throw new BadRequestException(
            `Tọa độ GPS thay đổi bất thường (Tốc độ suy ra: ${Math.round(speedMps * 3.6)} km/h). Cập nhật bị từ chối.`,
          );
        }
      }
    }

    const updated = await this.prisma.rescueTeam.update({
      where: { id: team.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        locationAccuracy: accuracy ?? null,
        locationUpdatedAt: now,
      },
    });

    return {
      success: true,
      location: {
        latitude: Number(updated.currentLatitude),
        longitude: Number(updated.currentLongitude),
        accuracy: updated.locationAccuracy ? Number(updated.locationAccuracy) : undefined,
        updatedAt: updated.locationUpdatedAt,
      },
    };
  }

  async getActiveLocations() {
    const teams = await this.prisma.rescueTeam.findMany({
      where: {
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
      orderBy: {
        locationUpdatedAt: 'desc',
      },
    });

    return teams.map((t) => ({
      teamId: t.id,
      teamName: t.name,
      latitude: Number(t.currentLatitude),
      longitude: Number(t.currentLongitude),
      accuracy: t.locationAccuracy ? Number(t.locationAccuracy) : undefined,
      updatedAt: t.locationUpdatedAt,
      status: t.status,
    }));
  }
}
