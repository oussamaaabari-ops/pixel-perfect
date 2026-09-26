/**
 * Plan 2D du calepinage (SVG) : emprise, modules, rangées, groupes de chaînes,
 * cotes, flèche Nord. Zoom (molette) et déplacement (glisser).
 * Export SVG / PNG ; DXF prévu ultérieurement.
 */
import { useMemo, useRef, useState } from "react";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { LayoutResult } from "@/lib/pv/layout";
import { bbox } from "@/lib/pv/geo";

const STRING_COLORS = ["#0F6B4F", "#1E4E8C", "#B7791F", "#7B3FA0", "#B83232", "#2C7A7B", "#5A6B1F", "#8C4A1E"];

export function LayoutDrawing({
  layout,
  modulesPerString,
  stringCount,
  tiltDeg,
  azimuthDeg,
  height = 520,
}: {
  layout: LayoutResult;
  modulesPerString: number;
  stringCount: number;
  tiltDeg: number;
  azimuthDeg: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const b = bbox(layout.polygon.length ? layout.polygon : [{ x: 0, y: 0 }]);
  const pad = Math.max(2, (b.maxX - b.minX) * 0.12);
  const base = { x: b.minX - pad, y: -(b.maxY + pad), w: b.maxX - b.minX + 2 * pad, h: b.maxY - b.minY + 2 * pad };
  const [view, setView] = useState(base);
  const drag = useRef<{ x: number; y: number; v: typeof base } | null>(null);
  const k = base.w / 100; // unité de trait

  const n = Math.max(1, modulesPerString);
  const assigned = Math.min(layout.moduleCount, n * stringCount);
  const polyPath = useMemo(
    () => layout.polygon.map((p, i) => `${i ? "L" : "M"}${p.x},${-p.y}`).join(" ") + " Z",
    [layout.polygon],
  );

  const zoom = (f: number) =>
    setView((v) => ({ x: v.x + (v.w * (1 - f)) / 2, y: v.y + (v.h * (1 - f)) / 2, w: v.w * f, h: v.h * f }));

  const exportSvg = (png: boolean) => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    if (!png) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "calepinage.svg";
      a.click();
      return;
    }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 2000;
      c.height = Math.round((2000 * view.h) / view.w);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "calepinage.png";
      a.click();
    };
    img.src = url;
  };

  const L = b.maxX - b.minX;
  const W = b.maxY - b.minY;

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="no-print flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
        <button type="button" onClick={() => zoom(0.8)} className="grid size-7 place-items-center rounded-sm border border-border" aria-label="Zoom avant"><ZoomIn className="size-3.5" /></button>
        <button type="button" onClick={() => zoom(1.25)} className="grid size-7 place-items-center rounded-sm border border-border" aria-label="Zoom arrière"><ZoomOut className="size-3.5" /></button>
        <button type="button" onClick={() => setView(base)} className="grid size-7 place-items-center rounded-sm border border-border" aria-label="Réinitialiser"><RotateCcw className="size-3.5" /></button>
        <span className="ml-2 text-[11px] text-muted-foreground">Molette : zoom · glisser : déplacer</span>
        <div className="ml-auto flex gap-1.5">
          <button type="button" onClick={() => exportSvg(false)} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs"><Download className="size-3" />SVG</button>
          <button type="button" onClick={() => exportSvg(true)} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs"><Download className="size-3" />PNG</button>
          <span className="inline-flex items-center rounded-sm border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">DXF — à venir</span>
        </div>
      </div>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        style={{ height, width: "100%", touchAction: "none", cursor: drag.current ? "grabbing" : "grab" }}
        className="tech-grid-fine block"
        onWheel={(e) => zoom(e.deltaY > 0 ? 1.1 : 0.9)}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, v: view };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const svg = svgRef.current;
          if (!d || !svg) return;
          const s = d.v.w / svg.clientWidth;
          setView({ ...d.v, x: d.v.x - (e.clientX - d.x) * s, y: d.v.y - (e.clientY - d.y) * s });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <rect x={base.x - base.w} y={base.y - base.h} width={base.w * 3} height={base.h * 3} fill="#ffffff" fillOpacity={0.6} />
        <path d={polyPath} fill="#F4B942" fillOpacity={0.08} stroke="#B7791F" strokeWidth={k * 0.35} strokeDasharray={`${k} ${k * 0.6}`} />
        {layout.modules.map((m) => {
          const si = m.index < assigned ? Math.floor(m.index / n) : -1;
          const fill = si >= 0 ? STRING_COLORS[si % STRING_COLORS.length] : "#9AA5A0";
          return (
            <polygon
              key={m.index}
              points={m.corners.map((c) => `${c.x},${-c.y}`).join(" ")}
              fill={fill}
              fillOpacity={si >= 0 ? 0.85 : 0.35}
              stroke="#0B1F17"
              strokeWidth={k * 0.08}
            />
          );
        })}
        {/* Cotes */}
        <g stroke="#17221D" strokeWidth={k * 0.12} fill="#17221D" fontSize={k * 2.2} fontFamily="JetBrains Mono, monospace">
          <line x1={b.minX} y1={-b.minY + pad * 0.5} x2={b.maxX} y2={-b.minY + pad * 0.5} />
          <line x1={b.minX} y1={-b.minY + pad * 0.3} x2={b.minX} y2={-b.minY + pad * 0.7} />
          <line x1={b.maxX} y1={-b.minY + pad * 0.3} x2={b.maxX} y2={-b.minY + pad * 0.7} />
          <text x={(b.minX + b.maxX) / 2} y={-b.minY + pad * 0.85} textAnchor="middle" stroke="none">{L.toFixed(1)} m</text>
          <line x1={b.maxX + pad * 0.5} y1={-b.maxY} x2={b.maxX + pad * 0.5} y2={-b.minY} />
          <text x={b.maxX + pad * 0.62} y={-(b.minY + b.maxY) / 2} stroke="none" transform={`rotate(90 ${b.maxX + pad * 0.62} ${-(b.minY + b.maxY) / 2})`} textAnchor="middle">{W.toFixed(1)} m</text>
        </g>
        {/* Nord */}
        <g transform={`translate(${b.minX - pad * 0.5} ${-b.maxY - pad * 0.1})`} fontFamily="Manrope, sans-serif">
          <polygon points={`0,${-k * 4} ${k * 1.5},${k} 0,0 ${-k * 1.5},${k}`} fill="#17221D" />
          <text y={-k * 4.8} textAnchor="middle" fontSize={k * 2.6} fontWeight={700} fill="#17221D">N</text>
        </g>
      </svg>
      <div className="grid gap-x-6 gap-y-1 border-t border-border px-4 py-3 text-xs sm:grid-cols-4">
        <Info k="Modules placés" v={`${layout.moduleCount}`} />
        <Info k="Rangées × colonnes" v={`${layout.rows} × ${layout.columns}`} />
        <Info k="Puissance DC (calepinage)" v={`${layout.dcPowerKwp.toFixed(2)} kWc`} />
        <Info k="Orientation" v={layout.orientation === "portrait" ? "Portrait" : "Paysage"} />
        <Info k="Inclinaison / azimut" v={`${tiltDeg}° / ${azimuthDeg}°`} />
        <Info k="Emprise" v={`${layout.areaM2.toFixed(1)} m²`} />
        <Info k="Surface occupée" v={`${layout.occupiedAreaM2.toFixed(1)} m²`} />
        <Info k="Pas des rangées" v={`${layout.rowPitchM.toFixed(2)} m`} />
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {Array.from({ length: Math.min(stringCount, 8) }).map((_, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="inline-block size-2.5" style={{ background: STRING_COLORS[i % STRING_COLORS.length] }} />
            Chaîne {i + 1}
          </span>
        ))}
        {stringCount > 8 && <span>… {stringCount} chaînes (couleurs répétées)</span>}
        <span className="inline-flex items-center gap-1"><span className="inline-block size-2.5 bg-[#9AA5A0] opacity-50" />Emplacement non câblé</span>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-dashed border-border py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="numeric font-medium">{v}</span>
    </div>
  );
}
