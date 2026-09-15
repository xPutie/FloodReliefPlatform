import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface RescueMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    type?: "REQUEST" | "TEAM" | undefined;
    priority?: string | null | undefined;
    status?: string | undefined;
    popupContent?: string | React.ReactNode | undefined;
    title?: string | undefined;
  }>;
  polyline?: {
    from: [number, number];
    to: [number, number];
    label?: string;
  } | null;
  selectedMarkerId?: string | null | undefined;
  draggableMarker?: {
    latitude: number;
    longitude: number;
    accuracy?: number | undefined;
    isGPS?: boolean | undefined;
    onDragEnd: (lat: number, lng: number) => void;
  } | undefined;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  autoFitBounds?: boolean;
}

export function RescueMap({
  center = [16.047079, 108.20623], // Default Vietnam overview / Da Nang center
  zoom = 12,
  markers = [],
  polyline,
  selectedMarkerId,
  draggableMarker,
  onMarkerClick,
  onMapClick,
  className = "h-80 w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200",
  autoFitBounds = false,
}: RescueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerLayerGroupRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);

  // Dynamically load Leaflet ESM module on client-side only
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((leafletModule) => {
      if (!isMounted) return;
      const L = leafletModule.default || leafletModule;
      leafletRef.current = L;

      // Fix Leaflet default icon paths in bundlers
      if (L && L.Icon && L.Icon.Default) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
          preferCanvas: true,
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          wheelPxPerZoomLevel: 120,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true,
        });

        // Primary Tile Layer: OpenStreetMap Standard Tiles (Smooth buffer & caching)
        const primaryTileLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: ["a", "b", "c"],
            maxZoom: 19,
            keepBuffer: 4,
            updateWhenIdle: false,
            updateWhenZooming: true,
          }
        );

        // Fallback Tile Layer: Esri World Street Map
        const fallbackTileLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri",
            maxZoom: 19,
            keepBuffer: 4,
          }
        );

        let tileLoaded = false;
        primaryTileLayer.on("tileload", () => {
          tileLoaded = true;
        });

        primaryTileLayer.on("tileerror", () => {
          if (!tileLoaded) {
            console.warn("Primary tile layer failed, switching to Esri World Street Map fallback...");
            map.removeLayer(primaryTileLayer);
            fallbackTileLayer.addTo(map);
          }
        });

        primaryTileLayer.addTo(map);

        markerLayerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Handle map click
        map.on("click", (e: any) => {
          if (onMapClick) {
            onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
          }
        });

        setIsReady(true);
      }
    }).catch((err) => {
      console.error("Failed to load Leaflet module:", err);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Center & Zoom
  useEffect(() => {
    if (mapInstanceRef.current && center && !autoFitBounds) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom, autoFitBounds]);

  // Render Markers & Draggable Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markerLayerGroupRef.current;
    const L = leafletRef.current;

    if (!map || !layerGroup || !L || !isReady) return;

    layerGroup.clearLayers();

    // Accuracy circle reset
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    const bounds = L.latLngBounds([]);
    let validCount = 0;

    // Render Draggable / Single Picker Marker
    if (draggableMarker) {
      const lat = draggableMarker.latitude;
      const lng = draggableMarker.longitude;
      const pos: [number, number] = [lat, lng];

      bounds.extend(pos);
      validCount++;

      // Create Custom Pin Icon
      const customIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(pos, {
        draggable: true,
        icon: customIcon,
      }).addTo(layerGroup);

      marker.bindPopup(`<b>📍 Vị trí đã chọn</b><br/>Tọa độ: ${lat}, ${lng}`).openPopup();

      marker.on("dragend", () => {
        const newPos = marker.getLatLng();
        draggableMarker.onDragEnd(
          Number(newPos.lat.toFixed(6)),
          Number(newPos.lng.toFixed(6))
        );
      });

      // Render accuracy circle if provided from real GPS
      if (draggableMarker.isGPS && draggableMarker.accuracy) {
        accuracyCircleRef.current = L.circle(pos, {
          radius: draggableMarker.accuracy,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
      }
    }

    // Render Multiple Markers (e.g. Coordinator Map / Operational Map)
    markers.forEach((m) => {
      if (!m.latitude || !m.longitude) return;
      const pos: [number, number] = [m.latitude, m.longitude];
      bounds.extend(pos);
      validCount++;

      const isSelected = selectedMarkerId === m.id;
      let customIcon: any;

      if (m.type === "TEAM") {
        // Distinct visual style for Rescue Team (Emerald Boat Pin)
        customIcon = L.divIcon({
          className: "custom-team-marker",
          html: `<div style="background-color: #059669; width: ${isSelected ? "28px" : "22px"}; height: ${isSelected ? "28px" : "22px"}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 11px; color: white;">🚤</div>`,
          iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
          iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
        });
      } else {
        // Priority-based marker color for Rescue Request
        let color = "#3b82f6"; // Blue medium default
        if (m.priority === "CRITICAL") color = "#dc2626"; // Red
        if (m.priority === "HIGH") color = "#f59e0b"; // Orange
        if (m.priority === "LOW") color = "#64748b"; // Slate

        customIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: ${isSelected ? "24px" : "18px"}; height: ${isSelected ? "24px" : "18px"}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); transform: ${isSelected ? "scale(1.2)" : "scale(1)"}; transition: all 0.2s;"></div>`,
          iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
          iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9],
        });
      }

      const marker = L.marker(pos, { icon: customIcon }).addTo(layerGroup);

      if (m.title || m.popupContent) {
        marker.bindPopup(String(m.popupContent || m.title));
      }

      if (isSelected) {
        marker.openPopup();
      }

      marker.on("click", () => {
        if (onMarkerClick) onMarkerClick(m.id);
      });
    });

    // Render visual line (polyline) between current team location and assigned rescue request
    if (polyline && polyline.from && polyline.to) {
      bounds.extend(polyline.from);
      bounds.extend(polyline.to);
      validCount += 2;

      L.polyline([polyline.from, polyline.to], {
        color: "#2563eb",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.85,
      }).addTo(layerGroup);
    }

    // Auto-fit bounds if requested
    if (autoFitBounds && validCount > 0) {
      if (validCount === 1) {
        map.setView(bounds.getCenter(), 15);
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [markers, polyline, selectedMarkerId, draggableMarker, autoFitBounds, isReady]);

  return <div ref={mapContainerRef} className={className} />;
}
