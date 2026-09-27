/**
 * Schéma unifilaire préliminaire (SVG) généré à partir du modèle de projet.
 * S'adapte : nombre de chaînes / MPPT / onduleurs, mono / tri, raccordé /
 * hors réseau / hybride, présence de batterie.
 */
import type { StudyResult } from "@/lib/pv/calc";
import type { Project } from "@/lib/pv/types";

const INK = "#17221D";
const DC = "#B7791F";
const AC = "#0F6B4F";
const MONO = "JetBrains Mono, monospace";

function T({ x, y, children, size = 10, anchor = "middle", weight = 400, color = INK }: {
  x: number; y: number; children: React.ReactNode; size?: number; anchor?: "start" | "middle" | "end"; weight?: number; color?: string;
}) {
  return <text x={x} y={y} fontSize={size} textAnchor={anchor} fontWeight={weight} fill={color} fontFamily={MONO}>{children}</text>;
}

/** Symbole module PV (rectangle + diagonale + flèches). */
function PvSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={INK} strokeWidth={1.2} fill="none">
      <rect x={x - 14} y={y - 10} width={28} height={20} fill="#fff" />
      <line x1={x - 14} y1={y + 10} x2={x + 14} y2={y - 10} />
      <path d={`M${x - 22},${y - 20} l6,6 m-2,-5 l2,5 l-5,-2`} />
    </g>
  );
}
function Fuse({ x, y, color }: { x: number; y: number; color: string }) {
  return <rect x={x - 4} y={y - 9} width={8} height={18} fill="#fff" stroke={color} strokeWidth={1.2} />;
}
function Switch({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={1.4}>
      <line x1={x} y1={y - 10} x2={x} y2={y - 6} />
      <line x1={x} y1={y - 6} x2={x + 8} y2={y + 6} />
      <line x1={x} y1={y + 6} x2={x} y2={y + 10} />
      <line x1={x - 4} y1={y - 6} x2={x + 4} y2={y - 6} />
    </g>
  );
}
function Breaker({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={1.4} fill="none">
      <line x1={x} y1={y - 12} x2={x} y2={y - 6} />
      <line x1={x} y1={y - 6} x2={x + 8} y2={y + 6} />
      <line x1={x} y1={y + 6} x2={x} y2={y + 12} />
      <path d={`M${x - 3},${y - 9} l6,6 m0,-6 l-6,6`} />
    </g>
  );
}
function Spd({ x, y, color }: { x: number; y: number; color: string }) {
  // dérivation vers la terre
  return (
    <g stroke={color} strokeWidth={1.2} fill="#fff">
      <line x1={x} y1={y} x2={x + 26} y2={y} />
      <rect x={x + 26} y={y - 8} width={12} height={22} />
      <path d={`M${x + 32},${y - 4} l-3,7 h6 l-3,7`} fill="none" />
      <line x1={x + 32} y1={y + 14} x2={x + 32} y2={y + 22} />
      <line x1={x + 25} y1={y + 22} x2={x + 39} y2={y + 22} />
      <line x1={x + 28} y1={y + 25} x2={x + 36} y2={y + 25} />
      <line x1={x + 31} y1={y + 28} x2={x + 33} y2={y + 28} />
    </g>
  );
}

export function SingleLineDiagram({ project, study }: { project: Project; study: StudyResult }) {
  const { inverter, module, strings, electrical, protections, cables, sizing } = study;
  const invQty = Math.max(1, project.selection.inverterQuantity);
  const totalStrings = Math.max(0, project.selection.stringCount);
  const nps = project.selection.modulesPerString;
  const hybrid = project.info.gridConnection === "hybride" || project.battery.mode !== "aucune";
  const offGrid = project.info.gridConnection === "hors-reseau";
  const phaseTxt = inverter.phases === 3 ? "3P+N / 400 V" : "1P+N / 230 V";
  const prot = (id: string) => protections.find((p) => p.id === id);
  const dcCable = cables.find((c) => c.id === "dc");
  const acCable = cables.find((c) => c.id === "ac");

  const mppts = inverter.mpptCount;
  const shownStrings = Math.min(totalStrings, 6);
  const colW = 110;
  const width = Math.max(760, shownStrings * colW + 260);
  const cx = width / 2;
  const topY = 60;
  const busY = 210;
  const invY = 380;
  const height = hybrid ? 900 : 860;

  const stringXs = Array.from({ length: shownStrings }, (_, i) => cx - ((shownStrings - 1) * colW) / 2 + i * colW);
  const fuseReq = prot("dc-fuse")?.required ?? false;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full bg-white" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sld-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#E7ECE9" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#sld-grid)" />
      <rect x={8} y={8} width={width - 16} height={height - 16} fill="none" stroke={INK} strokeWidth={1.2} />

      <T x={24} y={32} anchor="start" size={12} weight={700}>SCHÉMA UNIFILAIRE PRÉLIMINAIRE</T>
      <T x={width - 24} y={32} anchor="end" size={10}>{project.info.name}</T>

      {/* Chaînes */}
      {stringXs.map((x, i) => (
        <g key={i}>
          <PvSymbol x={x} y={topY + 30} />
          <line x1={x} y1={topY + 40} x2={x} y2={busY - 50} stroke={DC} strokeWidth={1.4} />
          <T x={x} y={topY + 58} size={9} weight={700}>Chaîne {i + 1}</T>
          <T x={x} y={topY + 70} size={8.5}>{nps} × {module.pmaxW} Wc</T>
          <T x={x} y={topY + 81} size={8.5}>Vmp {strings.vmpStcV.toFixed(0)} V</T>
          <T x={x} y={topY + 92} size={8.5}>Voc,max {strings.vocMaxV.toFixed(0)} V</T>
          <T x={x} y={topY + 103} size={8.5}>Imp {module.impA.toFixed(1)} A</T>
          {fuseReq && <Fuse x={x} y={busY - 60} color={DC} />}
          <line x1={x} y1={busY - 50} x2={x} y2={busY} stroke={DC} strokeWidth={1.4} />
        </g>
      ))}
      {totalStrings > shownStrings && (
        <T x={stringXs[stringXs.length - 1]! + colW * 0.7} y={topY + 34} size={10} weight={700}>+{totalStrings - shownStrings} chaînes</T>
      )}
      {totalStrings === 0 && <T x={cx} y={topY + 40} size={11} color="#B83232">Aucune chaîne configurée</T>}

      {/* Coffret DC */}
      <rect x={Math.min(...stringXs, cx) - 50} y={busY - 75} width={Math.max(...stringXs, cx) - Math.min(...stringXs, cx) + 100} height={170} fill="none" stroke={DC} strokeDasharray="5 4" />
      <T x={Math.min(...stringXs, cx) - 44} y={busY - 62} anchor="start" size={9} weight={700} color={DC}>COFFRET DC</T>
      <line x1={stringXs[0] ?? cx} y1={busY} x2={stringXs[stringXs.length - 1] ?? cx} y2={busY} stroke={DC} strokeWidth={2.2} />
      <T x={(stringXs[stringXs.length - 1] ?? cx) + 8} y={busY + 4} anchor="start" size={8.5} color={DC}>{mppts} MPPT · {Math.ceil(electrical.stringsPerMppt)} ch./MPPT</T>
      <line x1={cx} y1={busY} x2={cx} y2={invY - 40} stroke={DC} strokeWidth={1.6} />
      <Switch x={cx} y={busY + 30} color={DC} />
      <T x={cx + 16} y={busY + 34} anchor="start" size={8.5}>Sect. DC {prot("dc-isolator")?.rating}</T>
      <Spd x={cx} y={busY + 62} color={DC} />
      <T x={cx + 46} y={busY + 72} anchor="start" size={8.5}>Parafoudre DC · {prot("dc-spd")?.rating}</T>
      {fuseReq && <T x={cx - 16} y={busY - 38} anchor="end" size={8.5}>gPV {prot("dc-fuse")?.rating}</T>}
      {dcCable && (
        <T x={cx - 12} y={invY - 56} anchor="end" size={8.5} color={DC}>
          DC {dcCable.sectionMm2 ?? "?"} mm² · {dcCable.lengthM} m · ΔU {dcCable.voltageDropPct.toFixed(2)} %
        </T>
      )}

      {/* Onduleur */}
      <rect x={cx - 45} y={invY - 40} width={90} height={80} fill="#fff" stroke={INK} strokeWidth={1.6} />
      <line x1={cx - 45} y1={invY + 40} x2={cx + 45} y2={invY - 40} stroke={INK} />
      <T x={cx - 26} y={invY - 16} size={14}>=</T>
      <T x={cx + 26} y={invY + 28} size={14}>~</T>
      <T x={cx + 60} y={invY - 22} anchor="start" size={10} weight={700}>{hybrid ? "ONDULEUR HYBRIDE" : "ONDULEUR"}{invQty > 1 ? ` ×${invQty}` : ""}</T>
      <T x={cx + 60} y={invY - 8} anchor="start" size={8.5}>{inverter.manufacturer} {inverter.model}</T>
      <T x={cx + 60} y={invY + 5} anchor="start" size={8.5}>{inverter.acPowerKw} kW AC · {phaseTxt}</T>
      <T x={cx + 60} y={invY + 18} anchor="start" size={8.5}>MPPT : {mppts} · {inverter.mpptVminV}–{inverter.mpptVmaxV} V</T>
      <T x={cx + 60} y={invY + 31} anchor="start" size={8.5}>P DC {sizing.dcPowerKwp.toFixed(2)} kWc · DC/AC {sizing.dcAcRatio.toFixed(2)}</T>

      {/* Batterie */}
      {hybrid && (
        <g>
          <line x1={cx - 45} y1={invY} x2={cx - 150} y2={invY} stroke={DC} strokeWidth={1.6} />
          <Fuse x={cx - 100} y={invY} color={DC} />
          <g stroke={INK} strokeWidth={1.6}>
            <line x1={cx - 150} y1={invY - 16} x2={cx - 150} y2={invY + 16} />
            <line x1={cx - 160} y1={invY - 8} x2={cx - 160} y2={invY + 8} strokeWidth={3} />
          </g>
          <T x={cx - 160} y={invY + 32} size={9} weight={700}>BATTERIE</T>
          <T x={cx - 160} y={invY + 44} size={8.5}>{project.battery.mode === "aucune" ? "à définir" : `${project.battery.nominalKwh} kWh`}</T>
        </g>
      )}

      {/* Côté AC */}
      {(() => {
        const y0 = invY + 40;
        const brk = y0 + 45;
        const rcd = y0 + 95;
        const spdY = y0 + 135;
        const tgbt = y0 + 190;
        return (
          <g>
            <line x1={cx} y1={y0} x2={cx} y2={tgbt} stroke={AC} strokeWidth={1.6} />
            <rect x={cx - 150} y={y0 + 20} width={300} height={140} fill="none" stroke={AC} strokeDasharray="5 4" />
            <T x={cx - 144} y={y0 + 33} anchor="start" size={9} weight={700} color={AC}>COFFRET AC</T>
            <Breaker x={cx} y={brk} color={AC} />
            <T x={cx + 16} y={brk + 4} anchor="start" size={8.5}>Disj. {prot("ac-breaker")?.rating}</T>
            <Switch x={cx} y={rcd} color={AC} />
            <circle cx={cx + 4} cy={rcd} r={9} fill="none" stroke={AC} />
            <T x={cx + 16} y={rcd + 4} anchor="start" size={8.5}>DDR 30/300 mA type A/B</T>
            <Spd x={cx} y={spdY} color={AC} />
            <T x={cx + 46} y={spdY + 10} anchor="start" size={8.5}>Parafoudre AC · Uc ≥ 275 V</T>
            <T x={cx - 12} y={y0 + 14} anchor="end" size={8.5} color={AC}>
              I_AC {electrical.acCurrentA.toFixed(1)} A{acCable ? ` · ${acCable.sectionMm2 ?? "?"} mm² · ${acCable.lengthM} m · ΔU ${acCable.voltageDropPct.toFixed(2)} %` : ""}
            </T>
            {/* TGBT */}
            <line x1={cx - 180} y1={tgbt} x2={cx + 180} y2={tgbt} stroke={INK} strokeWidth={3} />
            <T x={cx + 186} y={tgbt + 4} anchor="start" size={9} weight={700}>TGBT</T>
            {/* Charges */}
            <line x1={cx - 120} y1={tgbt} x2={cx - 120} y2={tgbt + 60} stroke={INK} strokeWidth={1.4} />
            <polygon points={`${cx - 132},${tgbt + 60} ${cx - 108},${tgbt + 60} ${cx - 120},${tgbt + 78}`} fill="none" stroke={INK} strokeWidth={1.4} />
            <T x={cx - 120} y={tgbt + 94} size={9} weight={700}>CHARGES</T>
            {/* Réseau */}
            {!offGrid ? (
              <g>
                <line x1={cx + 120} y1={tgbt} x2={cx + 120} y2={tgbt + 50} stroke={INK} strokeWidth={1.4} />
                <rect x={cx + 106} y={tgbt + 50} width={28} height={20} fill="#fff" stroke={INK} />
                <T x={cx + 120} y={tgbt + 64} size={8}>kWh</T>
                <line x1={cx + 120} y1={tgbt + 70} x2={cx + 120} y2={tgbt + 90} stroke={INK} strokeWidth={1.4} />
                <g stroke={INK} strokeWidth={1.4}>
                  <line x1={cx + 104} y1={tgbt + 90} x2={cx + 136} y2={tgbt + 90} />
                  <line x1={cx + 108} y1={tgbt + 95} x2={cx + 132} y2={tgbt + 95} />
                  <line x1={cx + 112} y1={tgbt + 100} x2={cx + 128} y2={tgbt + 100} />
                </g>
                <T x={cx + 120} y={tgbt + 118} size={9} weight={700}>RÉSEAU {inverter.phases === 3 ? "400 V 3~" : "230 V 1~"}</T>
                <T x={cx + 120} y={tgbt + 130} size={8}>Compteur / point de livraison</T>
              </g>
            ) : (
              <T x={cx + 120} y={tgbt + 40} size={9} weight={700}>HORS RÉSEAU</T>
            )}
          </g>
        );
      })()}

      {/* Cartouche */}
      <g>
        <line x1={8} y1={height - 58} x2={width - 8} y2={height - 58} stroke={INK} />
        <T x={24} y={height - 38} anchor="start" size={8.5}>Légende : trait ambre = courant continu (DC) · trait vert = courant alternatif (AC) · pointillés = coffrets</T>
        <T x={24} y={height - 22} anchor="start" size={8.5} weight={700}>SÉLECTION PRÉLIMINAIRE — ne remplace pas une étude de coordination des protections ni un schéma d'exécution.</T>
      </g>
    </svg>
  );
}
