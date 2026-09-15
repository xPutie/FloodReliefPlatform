export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // In meters
}

export type GPSAccuracyRating = "EXCELLENT" | "GOOD" | "MODERATE" | "POOR";

export interface GPSAccuracyInfo {
  rating: GPSAccuracyRating;
  label: string;
  className: string;
}

export interface GeocodingResult {
  formattedAddress: string;
  raw?: any;
}
