/**
 * Géométrie du site — conversions géographiques et calculs de polygones.
 * Projection locale équirectangulaire autour du centroïde : précision
 * largement suffisante pour des emprises de quelques centaines de mètres.
 */

import type { LatLng } from "./types";

export type Pt = { x: number; y: number }; // mètres, x = Est, y = Nord

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function centroidLatLng(poly: LatLng[]): LatLng {
  const n = poly.length || 1;
  return [poly.reduce((a, p) => a + p[0], 0) / n, poly.reduce((a, p) => a + p[1], 0) / n];
}

export function toLocal(poly: LatLng[], origin: LatLng = centroidLatLng(poly)): Pt[] {
  const k = Math.cos(rad(origin[0]));
  return poly.map(([la, lo]) => ({
    x: rad(lo - origin[1]) * R * k,
    y: rad(la - origin[0]) * R,
  }));
}

export function toLatLng(pts: Pt[], origin: LatLng): LatLng[] {
  const k = Math.cos(rad(origin[0]));
  return pts.map((p) => [origin[0] + deg(p.y / R), origin[1] + deg(p.x / (R * k))]);
}

export function polygonArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function rotate(pts: Pt[], angleRad: number): Pt[] {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return pts.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));
}

export function bbox(pts: Pt[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Angle (rad, depuis l'axe Est) de l'arête la plus longue. */
export function longestEdgeAngle(pts: Pt[]): number {
  let best = 0;
  let ang = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d > best) {
      best = d;
      ang = Math.atan2(q.y - p.y, q.x - p.x);
    }
  }
  // normalise dans ]-90°, 90°]
  while (ang > Math.PI / 2) ang -= Math.PI;
  while (ang <= -Math.PI / 2) ang += Math.PI;
  return ang;
}

export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distToEdges(p: Pt, poly: Pt[]): number {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    d = Math.min(d, distToSegment(p, poly[i]!, poly[(i + 1) % poly.length]!));
  }
  return d;
}

/** Dimensions approximatives (rectangle englobant orienté sur l'arête la plus longue). */
export function polygonDimensions(pts: Pt[]) {
  const ang = longestEdgeAngle(pts);
  const b = bbox(rotate(pts, -ang));
  return { lengthM: b.maxX - b.minX, widthM: b.maxY - b.minY, edgeAngleDeg: deg(ang) };
}

export function rectangleFromCorners(a: LatLng, b: LatLng): LatLng[] {
  return [a, [a[0], b[1]], b, [b[0], a[1]]];
}

/**
 * Azimut PV (convention projet : 0° = Sud, −90° = Est, +90° = Ouest) des
 * modules posés perpendiculairement aux rangées, face à l'équateur.
 */
export function azimuthFromRowAngle(rowAngleDeg: number, latitude: number): number {
  // normale aux rangées orientée vers le Sud (hémisphère nord) ou le Nord
  let a = -rowAngleDeg;
  if (latitude < 0) a += 180;
  while (a > 180) a -= 360;
  while (a <= -180) a += 360;
  return Math.round(a);
}
