import type { GeocodingResult } from "./types";

let activeAbortController: AbortController | null = null;

/**
 * Reverse-geocode latitude and longitude into a human-readable Vietnamese address.
 * Primary Provider: Photon (Komoot OSM - Ultra fast, high resolution down to street/house)
 * Fallback Provider: BigDataCloud Reverse Geocoding Client (100% reliable CORS free)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  // Strategy 1: Try Photon API (Fast, detailed street level)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=default`;
    const res = await fetch(photonUrl, {
      signal: activeAbortController.signal,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.features?.[0]?.properties) {
        const props = data.features[0].properties;
        const parts: string[] = [];

        if (props.name) parts.push(props.name);
        if (props.housenumber && props.street) {
          parts.push(`${props.housenumber} ${props.street}`);
        } else if (props.street) {
          parts.push(props.street);
        }

        if (props.locality) parts.push(props.locality);
        if (props.district) parts.push(props.district);
        if (props.city || props.state) parts.push(props.city || props.state);

        if (parts.length > 0) {
          return {
            formattedAddress: parts.join(", "),
            raw: data,
          };
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") return null;
    console.warn("Photon reverse geocoding failed, trying fallback...", err);
  }

  // Strategy 2: Fallback to BigDataCloud Free Client Geocoding
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
    const res = await fetch(bdcUrl, {
      signal: activeAbortController.signal,
    });

    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];

      if (data.locality) parts.push(data.locality);
      if (data.principalSubdivision && data.principalSubdivision !== data.locality) {
        parts.push(data.principalSubdivision);
      }
      if (data.countryName) parts.push(data.countryName);

      if (parts.length > 0) {
        return {
          formattedAddress: parts.join(", "),
          raw: data,
        };
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") return null;
    console.warn("BigDataCloud reverse geocoding failed:", err);
  } finally {
    activeAbortController = null;
  }

  return null;
}

export interface ForwardGeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Forward-geocode an address query string into latitude & longitude coordinates.
 * Primary Provider: Photon (Komoot OSM Search - High speed forward geocoding)
 */
export async function forwardGeocode(
  query: string
): Promise<ForwardGeocodeResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data?.features?.[0]?.geometry?.coordinates) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      const props = data.features[0].properties || {};
      const parts: string[] = [];

      if (props.name) parts.push(props.name);
      if (props.street && props.name !== props.street) parts.push(props.street);
      if (props.city || props.district || props.state) {
        parts.push(props.city || props.district || props.state);
      }
      if (props.country) parts.push(props.country);

      return {
        latitude: lat,
        longitude: lng,
        displayName: parts.length > 0 ? parts.join(", ") : cleanQuery,
      };
    }
  } catch (err) {
    console.warn("Forward geocoding failed:", err);
  }
  return null;
}
