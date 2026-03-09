import type { LatLng } from "./LatLng";
import type { MapAdapter, SegmentStyle, RouteOptions, Report } from "./MapAdapter";

export class TrilhancaMap {
  constructor(private adapter: MapAdapter) {}
  showRoute(points: LatLng[], opts: RouteOptions = {}): void {
    const p = opts.simplifyTolerance ? simplify(points, opts.simplifyTolerance) : points;
    const [sw, ne] = bounds(p);
    this.adapter.clearLayer("route");
    const segments = segmentize(p);
    const styles = styleSegments(segments, opts);
    this.adapter.drawPolylineSegments(segments, styles);
    this.adapter.fitBounds(sw, ne);
  }
  addRoadReport(r: Report): void {
    this.adapter.clearLayer("reports");
    const color = r.severity === "grave" ? "#e74c3c" : r.severity === "moderada" ? "#f1c40f" : "#4cd137";
    const html = `<strong>${r.type} (${r.severity})</strong><br>${r.desc ?? ""}`;
    this.adapter.addMarker(r.pos, { color, radius: 8, fillOpacity: 0.35 }, html);
  }
}

export function bounds(points: LatLng[]): [LatLng, LatLng] {
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  for (const {lat, lng} of points) { if (lat < minLat) minLat = lat; if (lng < minLng) minLng = lng; if (lat > maxLat) maxLat = lat; if (lng > maxLng) maxLng = lng; }
  return [{lat: minLat, lng: minLng}, {lat: maxLat, lng: maxLng}];
}

export function simplify(points: LatLng[], tolerance: number): LatLng[] {
  const sqTol = tolerance * tolerance;
  const sqDist = (a: LatLng, b: LatLng) => { const dx = a.lat - b.lat, dy = a.lng - b.lng; return dx*dx + dy*dy; };
  const sqSegDist = (p: LatLng, a: LatLng, b: LatLng) => {
    let x = a.lat, y = a.lng, dx = b.lat - x, dy = b.lng - y;
    if (dx !== 0 || dy !== 0) { const t = ((p.lat - x) * dx + (p.lng - y) * dy) / (dx*dx + dy*dy); if (t > 1) { x = b.lat; y = b.lng; } else if (t > 0) { x += dx * t; y += dy * t; } }
    const dlat = p.lat - x, dlng = p.lng - y; return dlat*dlat + dlng*dlng;
  };
  const simplifyDP = (pts: LatLng[], first: number, last: number, out: LatLng[]) => {
    let maxDist = 0, index = 0;
    for (let i = first + 1; i < last; i++) { const dist = sqSegDist(pts[i], pts[first], pts[last]); if (dist > maxDist) { index = i; maxDist = dist; } }
    if (maxDist > sqTol) { if (index - first > 1) simplifyDP(pts, first, index, out); out.push(pts[index]); if (last - index > 1) simplifyDP(pts, index, last, out); }
  };
  if (points.length <= 2) return points.slice();
  const out = [points[0]]; simplifyDP(points, 0, points.length - 1, out); out.push(points[points.length - 1]); return out;
}

export function segmentize(points: LatLng[], maxLen = 256): LatLng[][] {
  const segs: LatLng[][] = []; let current: LatLng[] = [];
  for (const p of points) { current.push(p); if (current.length >= maxLen) { segs.push(current); current = [current[current.length - 1]]; } }
  if (current.length > 1) segs.push(current); return segs;
}

export function styleSegments(segs: LatLng[][], opts: RouteOptions): SegmentStyle[] {
  const base = opts.defaultStyle ?? { color: "#00d1ff", weight: 4, opacity: 0.9 };
  if (!opts.elevations || opts.elevations.length < 2) return segs.map(() => base);
  const styles: SegmentStyle[] = [];
  let idx = 0;
  for (const s of segs) {
    let gain = 0;
    for (let i = 1; i < s.length && idx + i < opts.elevations.length; i++) {
      const delta = opts.elevations[idx + i] - opts.elevations[idx + i - 1];
      if (delta > 0) gain += delta;
    }
    const color = gain > 50 ? "#e74c3c" : gain > 10 ? "#f1c40f" : "#2ecc71";
    styles.push({ color, weight: base.weight, opacity: base.opacity });
    idx += Math.max(1, s.length - 1);
  }
  return styles;
}
