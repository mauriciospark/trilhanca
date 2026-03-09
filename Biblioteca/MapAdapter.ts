import type { LatLng } from "./LatLng";

export type SegmentStyle = { color: string; weight: number; opacity: number };
export type RouteOptions = { simplifyTolerance?: number; defaultStyle?: SegmentStyle; elevations?: number[] };
export type Report = { pos: LatLng; type: "buracos"|"lama"|"obstrucao"|"trafego"|"boa"; severity: "leve"|"moderada"|"grave"; desc?: string; ts?: number };

export interface MapAdapter {
  drawPolyline(points: LatLng[], style: SegmentStyle): void;
  drawPolylineSegments(segments: LatLng[][], styles: SegmentStyle[]): void;
  fitBounds(sw: LatLng, ne: LatLng): void;
  addMarker(pos: LatLng, style?: { color?: string; radius?: number; fillOpacity?: number }, popupHtml?: string): void;
  clearLayer(name: "route"|"reports"): void;
}
