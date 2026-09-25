/**
 * PROTECTIONS ET CÂBLES — sélection préliminaire.
 *
 * Règles simplifiées inspirées de l'IEC 62548 (côté DC) et de l'IEC 60364
 * (côté AC, sections). Architecture volontairement modulaire : chaque
 * fonction peut être remplacée par un calcul normatif détaillé.
 */

import type { CheckStatus, Inverter, Project, PvModule } from "./types";

export const STANDARD_FUSES_A = [10, 12, 15, 16, 20, 25, 30, 32];
export const STANDARD_BREAKERS_A = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
export const STANDARD_ISOLATORS_A = [16, 20, 25, 32, 40, 63, 80, 100, 125, 160];
export const SECTIONS_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

/** Courants admissibles de base, cuivre isolé PR/XLPE 90 °C, 2 conducteurs chargés, 30 °C (valeurs indicatives IEC 60364-5-52). */
const BASE_AMPACITY_CU: Record<"B1" | "C" | "E", number[]> = {
  B1: [23, 31, 42, 54, 75, 100, 133, 164, 198, 253, 306, 354],
  C: [24, 33, 45, 58, 80, 107, 138, 171, 209, 269, 328, 382],
  E: [26, 36, 49, 63, 86, 115, 149, 185, 225, 289, 352, 410],
};
const GROUPING = [1, 0.8, 0.7, 0.65, 0.6, 0.57, 0.54, 0.52, 0.5];
const RHO = { cuivre: 0.0225, aluminium: 0.036 }; // Ω·mm²/m (température de service)

const pick = (list: number[], min: number) => list.find((v) => v >= min) ?? null;

export interface ElectricalContext {
  vocMaxV: number;
  vmpStcV: number;
  stringsPerMppt: number; // entier arrondi supérieur
  totalStrings: number;
  inverterAcKw: number; // par onduleur
  phases: 1 | 3;
  acVoltageV: number;
  acCurrentA: number; // par onduleur
  iscA: number;
  impA: number;
}

export function electricalContext(
  project: Project,
  module: PvModule,
  inverter: Inverter,
  vocMaxV: number,
): ElectricalContext {
  const s = project.selection;
  const inv = Math.max(1, s.inverterQuantity);
  const acV = inverter.phases === 3 ? 400 : 230;
  const acI = (inverter.acPowerKw * 1000) / (inverter.phases === 3 ? Math.sqrt(3) * acV : acV);
  return {
    vocMaxV,
    vmpStcV: Math.max(1, s.modulesPerString) * module.vmpV,
    stringsPerMppt: Math.ceil(s.stringCount / Math.max(1, inverter.mpptCount * inv)),
    totalStrings: s.stringCount,
    inverterAcKw: inverter.acPowerKw,
    phases: inverter.phases,
    acVoltageV: acV,
    acCurrentA: acI,
    iscA: module.iscA,
    impA: module.impA,
  };
}

export interface ProtectionItem {
  id: string;
  side: "DC" | "AC";
  label: string;
  required: boolean;
  rating: string;
  basis: string;
}

export function computeProtections(ctx: ElectricalContext, project: Project): ProtectionItem[] {
  const items: ProtectionItem[] = [];
  const n = ctx.stringsPerMppt;
  const fuseNeeded = n >= 3;
  const fuseMin = 1.5 * ctx.iscA;
  const fuseMax = 2.4 * ctx.iscA;
  const fuse = STANDARD_FUSES_A.find((f) => f >= fuseMin && f <= fuseMax) ?? null;
  items.push({
    id: "dc-fuse",
    side: "DC",
    label: "Fusibles de chaîne gPV",
    required: fuseNeeded,
    rating: fuseNeeded
      ? `${fuse ? `${fuse} A` : "à définir"} · ${Math.ceil(ctx.vocMaxV / 100) * 100} V DC min.`
      : "Non requis",
    basis: fuseNeeded
      ? `${n} chaînes en parallèle par MPPT (≥ 3). Plage 1,5·Isc – 2,4·Isc = ${fuseMin.toFixed(1)} – ${fuseMax.toFixed(1)} A. Vérifier le courant inverse admissible du module.`
      : `${n} chaîne(s) par MPPT : le courant inverse d'une chaîne en défaut reste limité, fusibles généralement non requis (à confirmer selon la fiche module).`,
  });
  const isoI = 1.25 * ctx.iscA * n;
  const iso = pick(STANDARD_ISOLATORS_A, isoI);
  items.push({
    id: "dc-isolator",
    side: "DC",
    label: "Interrupteur-sectionneur DC",
    required: true,
    rating: `${iso ?? "> 160"} A · ≥ ${Math.ceil(ctx.vocMaxV / 50) * 50} V DC · DC-PV2`,
    basis: `Ie ≥ 1,25 × Isc × ${n} = ${isoI.toFixed(1)} A ; Ue ≥ Uoc,max = ${ctx.vocMaxV.toFixed(0)} V.`,
  });
  items.push({
    id: "dc-spd",
    side: "DC",
    label: "Parafoudre DC (type 2)",
    required: true,
    rating: `Ucpv ≥ ${Math.ceil((1.2 * ctx.vocMaxV) / 50) * 50} V DC · In ≥ 5 kA`,
    basis: "Ucpv ≥ 1,2 × Uoc,max. Type 1 si paratonnerre présent. Nécessité à confirmer par analyse du risque foudre.",
  });
  const brkI = 1.25 * ctx.acCurrentA;
  const brk = pick(STANDARD_BREAKERS_A, brkI);
  const poles = ctx.phases === 3 ? "4P" : "2P";
  items.push({
    id: "ac-breaker",
    side: "AC",
    label: "Disjoncteur AC onduleur",
    required: true,
    rating: `${brk ?? "> 250"} A · courbe C · ${poles}`,
    basis: `I_AC = ${ctx.acCurrentA.toFixed(1)} A ; In ≥ 1,25 × I_AC = ${brkI.toFixed(1)} A. Pouvoir de coupure selon Icc au point d'installation.`,
  });
  items.push({
    id: "ac-isolator",
    side: "AC",
    label: "Interrupteur-sectionneur AC",
    required: true,
    rating: `≥ ${brk ?? "> 250"} A · ${poles}`,
    basis: "Coupure locale pour maintenance de l'onduleur ; calibre ≥ disjoncteur amont.",
  });
  items.push({
    id: "ac-rcd",
    side: "AC",
    label: "Dispositif différentiel",
    required: true,
    rating: "30 mA ou 300 mA · type A (type B si l'onduleur ne garantit pas l'absence de courant DC)",
    basis: "Selon schéma de liaison à la terre et déclaration constructeur de l'onduleur (séparation galvanique / RCMU).",
  });
  items.push({
    id: "ac-spd",
    side: "AC",
    label: "Parafoudre AC (type 2)",
    required: true,
    rating: `Uc ≥ 275 V · In ≥ 5 kA · ${poles}`,
    basis: "Implantation au TGBT ou coffret AC ; coordination avec le parafoudre de tête.",
  });
  if (project.info.gridConnection !== "raccorde" || project.battery.mode !== "aucune") {
    items.push({
      id: "dc-battery",
      side: "DC",
      label: "Protection batterie",
      required: true,
      rating: "Fusible / disjoncteur DC selon courant de décharge max. de la batterie",
      basis: "Calibrée selon la fiche de la batterie et de l'onduleur hybride.",
    });
  }
  return items;
}

export interface CableResult {
  id: "dc" | "ac";
  label: string;
  designCurrentA: number;
  lengthM: number;
  sectionMm2: number | null;
  ampacityA: number;
  voltageDropV: number;
  voltageDropPct: number;
  maxDropPct: number;
  status: CheckStatus;
  note: string;
}

function tempFactor(ambientC: number) {
  // isolant 90 °C, référence 30 °C
  return Math.sqrt(Math.max(0, 90 - ambientC) / 60);
}

function sizeCable(
  id: "dc" | "ac",
  label: string,
  designI: number,
  operatingI: number,
  voltage: number,
  lengthM: number,
  dropFactor: number, // 2 (DC / mono) ou √3 (tri)
  maxDropPct: number,
  project: Project,
  minSection: number,
): CableResult {
  const c = project.cables;
  const base = BASE_AMPACITY_CU[c.method];
  const matF = c.material === "aluminium" ? 0.78 : 1;
  const kt = tempFactor(c.ambientC);
  const kg = GROUPING[Math.min(GROUPING.length - 1, Math.max(0, c.groupedCircuits - 1))] ?? 0.5;
  const rho = RHO[c.material];
  let result: CableResult | null = null;
  for (let i = 0; i < SECTIONS_MM2.length; i++) {
    const S = SECTIONS_MM2[i]!;
    if (S < minSection) continue;
    if (c.material === "aluminium" && S < 16) continue;
    const iz = (base[i] ?? 0) * matF * kt * kg;
    const dU = (dropFactor * lengthM * operatingI * rho) / S;
    const pctDrop = voltage > 0 ? (dU / voltage) * 100 : 0;
    const r: CableResult = {
      id,
      label,
      designCurrentA: designI,
      lengthM,
      sectionMm2: S,
      ampacityA: iz,
      voltageDropV: dU,
      voltageDropPct: pctDrop,
      maxDropPct,
      status: "ok",
      note: "",
    };
    if (iz >= designI && pctDrop <= maxDropPct) {
      result = r;
      break;
    }
  }
  if (!result) {
    return {
      id,
      label,
      designCurrentA: designI,
      lengthM,
      sectionMm2: null,
      ampacityA: 0,
      voltageDropV: 0,
      voltageDropPct: 0,
      maxDropPct,
      status: "error",
      note: "Aucune section standard ≤ 120 mm² ne satisfait simultanément le courant admissible et la chute de tension. Réduire la longueur ou revoir l'architecture.",
    };
  }
  if (result.voltageDropPct > 0.8 * maxDropPct || (result.sectionMm2 ?? 0) >= 50) {
    result.status = "warning";
    result.note = "Section retenue proche de la limite de chute de tension ou de forte section : à vérifier lors des études détaillées.";
  } else {
    result.note = "Courant admissible et chute de tension respectés (calcul préliminaire).";
  }
  return result;
}

export function computeCables(ctx: ElectricalContext, project: Project): CableResult[] {
  const c = project.cables;
  const dc = sizeCable(
    "dc",
    "Câble DC chaîne → onduleur",
    1.25 * ctx.iscA,
    ctx.impA,
    ctx.vmpStcV,
    Math.max(0, c.dcLengthM),
    2,
    c.maxDropDcPct,
    project,
    4,
  );
  const ac = sizeCable(
    "ac",
    "Câble AC onduleur → TGBT",
    ctx.acCurrentA,
    ctx.acCurrentA,
    ctx.acVoltageV,
    Math.max(0, c.acLengthM),
    ctx.phases === 3 ? Math.sqrt(3) : 2,
    c.maxDropAcPct,
    project,
    2.5,
  );
  return [dc, ac];
}
