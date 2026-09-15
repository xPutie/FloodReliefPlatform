import { calculateHaversineDistance, type DistanceResult } from "@/lib/location/distance";
import { getLocationFreshness, type FreshnessInfo } from "@/lib/location/location-freshness";

export interface CandidateTeamInput {
  id: string;
  name: string;
  status: string; // "AVAILABLE" | "ON_MISSION" | "OFFLINE"
  capacity: number;
  capability?: string | null | undefined;
  latitude?: number | string | null | undefined;
  longitude?: number | string | null | undefined;
  accuracy?: number | string | null | undefined;
  locationUpdatedAt?: string | Date | null | undefined;
}

export interface RequestTargetInput {
  id: string;
  latitude?: number | string | null | undefined;
  longitude?: number | string | null | undefined;
  locationAddress?: string | undefined;
}

export interface RankedCandidateTeam {
  team: CandidateTeamInput;
  hasGps: boolean;
  distance: DistanceResult | null;
  freshness: FreshnessInfo;
  suitabilityScore: number;
  reason: string;
  rank: number;
}

/**
 * Analyzes and ranks rescue teams by operational suitability for a rescue request.
 * 
 * Priority criteria:
 * 1. Has valid GPS coordinates
 * 2. Location freshness (LIVE > RECENT > STALE)
 * 3. Operational status (AVAILABLE > ON_MISSION > OFFLINE)
 * 4. Haversine straight-line distance (Shorter is better)
 */
export function rankCandidateTeams(
  teams: CandidateTeamInput[],
  request: RequestTargetInput
): RankedCandidateTeam[] {
  const reqLat = request.latitude;
  const reqLon = request.longitude;

  const candidates: Omit<RankedCandidateTeam, "rank">[] = teams.map((team) => {
    const hasGps =
      team.latitude !== null &&
      team.latitude !== undefined &&
      team.longitude !== null &&
      team.longitude !== undefined &&
      !isNaN(Number(team.latitude)) &&
      !isNaN(Number(team.longitude));

    const distance = hasGps
      ? calculateHaversineDistance(team.latitude, team.longitude, reqLat, reqLon)
      : null;

    const freshness = getLocationFreshness(team.locationUpdatedAt);

    // Calculate transparent suitability score (higher is better)
    let score = 0;

    // Status weighting
    if (team.status === "AVAILABLE") score += 1000;
    else if (team.status === "ON_MISSION") score += 200;
    else score += 0; // OFFLINE

    // GPS availability & Freshness weighting
    if (hasGps) {
      score += 500;
      if (freshness.state === "LIVE") score += 300;
      else if (freshness.state === "RECENT") score += 150;
      else if (freshness.state === "STALE") score += 50;
    }

    // Distance weighting (max 200 pts for close distance)
    if (distance) {
      const distanceBonus = Math.max(0, 200 - distance.distanceKm * 10);
      score += distanceBonus;
    }

    // Human-readable transparent reason
    let reason = "";
    if (team.status !== "AVAILABLE") {
      if (team.status === "ON_MISSION") reason = "Đang thực hiện nhiệm vụ khác";
      else reason = "Đội đang ngoại tuyến (OFFLINE)";
    } else if (!hasGps) {
      reason = "Đang sẵn sàng nhưng chưa chia sẻ vị trí GPS";
    } else if (freshness.state === "STALE") {
      reason = "AVAILABLE nhưng tín hiệu GPS đã cũ";
    } else {
      if (distance) {
        reason = `AVAILABLE + GPS mới + khoảng cách ${distance.formattedKm}`;
      } else {
        reason = "AVAILABLE + GPS mới (Yêu cầu chưa có GPS)";
      }
    }

    return {
      team,
      hasGps,
      distance,
      freshness,
      suitabilityScore: Math.round(score),
      reason,
    };
  });

  // Sort candidates by score descending
  candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return candidates.map((c, index) => ({
    ...c,
    rank: index + 1,
  }));
}
