/**
 * CALEPINAGE AUTOMATIQUE PRÉLIMINAIRE.
 *
 * Place des modules rectangulaires dans l'emprise (polygone dessiné ou
 * rectangle longueur × largeur), dans un repère aligné sur les rangées.
 * Ne remplace pas un plan d'exécution : contraintes structurelles,
 * obstacles, zones de vent et réglementation incendie non modélisés.
 */

import {
  bbox,
  distToEdges,
  longestEdgeAngle,
  pointInPolygon,
  polygonArea,
  polygonDimensions,
  rotate,
  toLocal,
  type Pt,
} from "./geo";
import type { LayoutInput, Project, PvModule } from "./types";

export interface PlacedModule {
  /** Coins dans le repère local (m, x = Est, y = Nord). */
  corners: Pt[];
  row: number;
  col: number;
  index: number;
}

export interface LayoutResult {
  source: "polygone" | "rectangle";
  polygon: Pt[]; // repère local
  rowAngleDeg: number;
  areaM2: number;
  lengthM: number;
  widthM: number;
  modules: PlacedModule[];
  moduleCount: number;
  rows: number;
  columns: number;
  dcPowerKwp: number;
  occupiedAreaM2: number; // surface projetée des modules
  remainingAreaM2: number;
  footprintDepthM: number; // profondeur projetée d'un module
  rowPitchM: number;
  rowGapM: number;
  orientation: LayoutInput["orientation"];
  winterSolarElevationDeg: number;
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Hauteur solaire à midi au solstice d'hiver (°). */
export function winterNoonElevation(latitude: number): number {
  return Math.max(5, 90 - Math.abs(latitude) - 23.45);
}

/** Espacement libre entre rangées pour éviter l'ombrage à midi au solstice d'hiver. */
export function shadingFreeGap(moduleSlopeLengthM: number, tiltDeg: number, latitude: number) {
  const h = moduleSlopeLengthM * Math.sin(rad(tiltDeg));
  return h / Math.tan(rad(winterNoonElevation(latitude)));
}

function sitePolygon(project: Project): { pts: Pt[]; source: LayoutResult["source"] } {
  const poly = project.site?.polygon ?? [];
  if (poly.length >= 3) return { pts: toLocal(poly), source: "polygone" };
  const L = Math.max(0, project.area.roofLengthM);
  const W = Math.max(0, project.area.roofWidthM);
  return {
    pts: [
      { x: -L / 2, y: -W / 2 },
      { x: L / 2, y: -W / 2 },
      { x: L / 2, y: W / 2 },
      { x: -L / 2, y: W / 2 },
    ],
    source: "rectangle",
  };
}

interface Grid {
  rects: { x: number; y: number; row: number; col: number }[];
  w: number;
  d: number;
  pitch: number;
  gap: number;
}

function pack(
  poly: Pt[],
  module: PvModule,
  cfg: LayoutInput,
  orientation: LayoutInput["orientation"],
  tiltDeg: number,
  latitude: number,
  flatMount: boolean,
): Grid {
  const Lm = module.lengthMm / 1000;
  const Wm = module.widthMm / 1000;
  // w = dimension le long de la rangée ; s = dimension dans la pente
  const w = orientation === "portrait" ? Wm : Lm;
  const s = orientation === "portrait" ? Lm : Wm;
  const d = s * Math.cos(rad(tiltDeg)); // profondeur projetée
  let gap = Math.max(0, cfg.rowSpacingM);
  if (cfg.mode === "espacement-optimise" && flatMount && tiltDeg > 0) {
    gap = Math.max(gap, shadingFreeGap(s, tiltDeg, latitude));
  }
  if (!flatMount) gap = Math.max(0.02, cfg.moduleGapM); // pose coplanaire : rangées jointives
  const pitch = d + gap;
  const colPitch = w + Math.max(0, cfg.moduleGapM);
  const b = bbox(poly);
  const setback = Math.max(0, cfg.setbackM);

  let best: Grid = { rects: [], w, d, pitch, gap };
  const offsets = cfg.mode === "max-modules" || cfg.mode === "max-puissance" ? 4 : 1;
  for (let ox = 0; ox < offsets; ox++) {
    for (let oy = 0; oy < offsets; oy++) {
      const rects: Grid["rects"] = [];
      let row = 0;
      let y = b.minY + setback + (oy / offsets) * pitch;
      let rowsSinceCorridor = 0;
      while (y + d <= b.maxY - setback + 1e-6) {
        let col = 0;
        let placedInRow = 0;
        for (let x = b.minX + setback + (ox / offsets) * colPitch; x + w <= b.maxX - setback + 1e-6; x += colPitch) {
          const corners = [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + d },
            { x, y: y + d },
          ];
          const ok = corners.every(
            (c) => pointInPolygon(c, poly) && distToEdges(c, poly) >= setback - 1e-6,
          );
          if (ok) {
            rects.push({ x, y, row, col });
            placedInRow++;
          }
          col++;
        }
        if (placedInRow > 0) row++;
        rowsSinceCorridor += placedInRow > 0 ? 1 : 0;
        y += pitch;
        if (cfg.corridorEveryRows > 0 && rowsSinceCorridor >= cfg.corridorEveryRows) {
          y += Math.max(0, cfg.corridorWidthM);
          rowsSinceCorridor = 0;
        }
      }
      if (rects.length > best.rects.length) best = { rects, w, d, pitch, gap };
    }
  }
  return best;
}

export function computeLayout(project: Project, module: PvModule): LayoutResult {
  const cfg = project.layout;
  const { pts, source } = sitePolygon(project);
  const latitude = project.info.latitude;
  const tilt = Math.max(0, Math.min(90, project.area.tiltDeg));
  // Toiture inclinée : pose coplanaire (pas d'ombrage inter-rangées). Sol / toiture-terrasse / ombrière : rangées inclinées.
  const flatMount = project.area.installationType !== "toiture" || tilt <= 5 || source === "polygone";

  const angle =
    cfg.rowAngleDeg !== null && Number.isFinite(cfg.rowAngleDeg)
      ? rad(cfg.rowAngleDeg)
      : pts.length >= 3
        ? longestEdgeAngle(pts)
        : 0;
  const aligned = rotate(pts, -angle);

  const orientations: LayoutInput["orientation"][] =
    cfg.mode === "max-puissance" ? ["portrait", "paysage"] : [cfg.orientation];
  let grid: Grid | null = null;
  let chosen = cfg.orientation;
  for (const o of orientations) {
    const g = pack(aligned, module, cfg, o, tilt, latitude, flatMount);
    if (!grid || g.rects.length > grid.rects.length) {
      grid = g;
      chosen = o;
    }
  }
  const g = grid!;

  // Renumérotation rangées / colonnes compactes
  const rowIds = [...new Set(g.rects.map((r) => r.row))].sort((a, b) => a - b);
  const colIds = [...new Set(g.rects.map((r) => r.col))].sort((a, b) => a - b);
  const modules: PlacedModule[] = g.rects
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((r, index) => ({
      corners: rotate(
        [
          { x: r.x, y: r.y },
          { x: r.x + g.w, y: r.y },
          { x: r.x + g.w, y: r.y + g.d },
          { x: r.x, y: r.y + g.d },
        ],
        angle,
      ),
      row: rowIds.indexOf(r.row),
      col: colIds.indexOf(r.col),
      index,
    }));

  const area = polygonArea(pts);
  const dims = polygonDimensions(pts);
  const occupied = modules.length * g.w * g.d;
  return {
    source,
    polygon: pts,
    rowAngleDeg: (angle * 180) / Math.PI,
    areaM2: area,
    lengthM: dims.lengthM,
    widthM: dims.widthM,
    modules,
    moduleCount: modules.length,
    rows: rowIds.length,
    columns: colIds.length,
    dcPowerKwp: (modules.length * module.pmaxW) / 1000,
    occupiedAreaM2: occupied,
    remainingAreaM2: Math.max(0, area - occupied),
    footprintDepthM: g.d,
    rowPitchM: g.pitch,
    rowGapM: g.gap,
    orientation: chosen,
    winterSolarElevationDeg: winterNoonElevation(latitude),
  };
}

export const LAYOUT_DISCLAIMER =
  "Calepinage automatique préliminaire — l'implantation définitive doit être validée sur la base de relevés sur site, des contraintes structurelles, des distances de sécurité, de la réglementation incendie et des exigences d'accès et de maintenance.";
