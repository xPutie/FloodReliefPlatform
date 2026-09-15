/**
 * Haversine formula to calculate straight-line (great-circle) distance
 * between two GPS coordinates on Earth in kilometers and meters.
 * 
 * IMPORTANT: This is STRAIGHT-LINE / GREAT-CIRCLE DISTANCE ("Khoảng cách đường chim bay").
 * Never label it as driving distance, travel time, or route distance.
 */

export interface DistanceResult {
  distanceKm: number;
  distanceMeters: number;
  formattedKm: string;
}

/**
 * Calculates Haversine distance between (lat1, lon1) and (lat2, lon2).
 * Returns null if any coordinate is missing, null, or non-numeric.
 */
export function calculateHaversineDistance(
  lat1: number | string | null | undefined,
  lon1: number | string | null | undefined,
  lat2: number | string | null | undefined,
  lon2: number | string | null | undefined
): DistanceResult | null {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (
    isNaN(numLat1) ||
    isNaN(numLon1) ||
    isNaN(numLat2) ||
    isNaN(numLon2)
  ) {
    return null;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(numLat2 - numLat1);
  const dLon = toRad(numLon2 - numLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(numLat1)) *
      Math.cos(toRad(numLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMeters = Math.round(distanceKm * 1000);

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceMeters,
    formattedKm: distanceKm < 1 ? `${distanceMeters}m` : `${distanceKm.toFixed(1)} km`,
  };
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats a distance result or returns a fallback Vietnamese string.
 */
export function formatDistanceLabel(result: DistanceResult | null): string {
  if (!result) return "Không đủ dữ liệu GPS";
  return `${result.formattedKm} (Đường chim bay)`;
}
