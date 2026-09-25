/**
 * MOTEUR DE CALCUL — pré-dimensionnement photovoltaïque.
 *
 * Toutes les fonctions sont pures et indépendantes de l'interface.
 * Les modèles sont volontairement simplifiés (pas de simulation horaire) et
 * destinés à une estimation préliminaire.
 */

import { getInverter, getModule } from "./equipment";
import type {
  EngineeringCheck,
  Inverter,
  Project,
  PvModule,
} from "./types";

/**
 * Profil mensuel générique de répartition de l'irradiation (hémisphère nord,
 * latitudes moyennes). HYPOTHÈSE de forme, pas une donnée météorologique
 * mesurée. À remplacer par PVGIS / Meteonorm / Solargis.
 */
export const GENERIC_MONTHLY_IRRADIATION_SHARE = [
  0.058, 0.066, 0.085, 0.091, 0.101, 0.104, 0.107, 0.102, 0.09, 0.077, 0.062, 0.057,
];

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const DEFAULT_MONTHLY_CONSUMPTION_SHARE = [
  0.084, 0.076, 0.08, 0.077, 0.081, 0.089, 0.098, 0.096, 0.084, 0.081, 0.079, 0.075,
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const safe = (v: number) => (Number.isFinite(v) ? v : 0);

/* ------------------------------------------------------------------ */
/* Consommation                                                        */
/* ------------------------------------------------------------------ */

export interface ConsumptionResult {
  annualKwh: number;
  monthlyKwh: number[];
  averageMonthlyKwh: number;
  averageDailyKwh: number;
  shares: number[];
}

export function computeConsumption(project: Project): ConsumptionResult {
  const c = project.consumption;
  let monthly: number[];
  if (c.mode === "mensuelle") {
    monthly = c.monthlyKwh.map(safe);
  } else {
    monthly = DEFAULT_MONTHLY_CONSUMPTION_SHARE.map((s) => safe(c.annualKwh) * s);
  }
  const annual = monthly.reduce((a, b) => a + b, 0);
  return {
    annualKwh: annual,
    monthlyKwh: monthly,
    averageMonthlyKwh: annual / 12,
    averageDailyKwh: annual / 365,
    shares: monthly.map((m) => (annual > 0 ? m / annual : 0)),
  };
}

/* ------------------------------------------------------------------ */
/* Capacité géométrique de la zone d'implantation                      */
/* ------------------------------------------------------------------ */

export interface GeometryResult {
  moduleAreaM2: number;
  usableAreaM2: number;
  maxModulesByArea: number;
  occupiedAreaM2: number;
  remainingAreaM2: number;
}

export function computeGeometry(project: Project, module: PvModule): GeometryResult {
  const a = project.area;
  const moduleArea = (module.lengthMm / 1000) * (module.widthMm / 1000);
  const gross =
    a.availableAreaM2 > 0 ? a.availableAreaM2 : safe(a.roofLengthM) * safe(a.roofWidthM);
  const usable = gross * clamp(a.usableAreaFactorPct, 0, 100) / 100;
  const maxModules = moduleArea > 0 ? Math.floor(usable / moduleArea) : 0;
  return {
    moduleAreaM2: moduleArea,
    usableAreaM2: usable,
    maxModulesByArea: maxModules,
    occupiedAreaM2: 0,
    remainingAreaM2: usable,
  };
}

/* ------------------------------------------------------------------ */
/* Dimensionnement électrique                                          */
/* ------------------------------------------------------------------ */

export interface SizingResult {
  moduleCount: number;
  dcPowerKwp: number;
  acPowerKw: number;
  dcAcRatio: number;
  occupiedAreaM2: number;
  remainingAreaM2: number;
  modulesPerString: number;
  stringCount: number;
  stringsPerMppt: number;
}

export function computeSizing(
  project: Project,
  module: PvModule,
  inverter: Inverter,
  geometry: GeometryResult,
): SizingResult {
  const s = project.selection;
  const moduleCount = Math.max(0, Math.round(s.modulesPerString * s.stringCount));
  const dcPowerKwp = (moduleCount * module.pmaxW) / 1000;
  const acPowerKw = inverter.acPowerKw * Math.max(1, s.inverterQuantity);
  const occupied = moduleCount * geometry.moduleAreaM2;
  return {
    moduleCount,
    dcPowerKwp,
    acPowerKw,
    dcAcRatio: acPowerKw > 0 ? dcPowerKwp / acPowerKw : 0,
    occupiedAreaM2: occupied,
    remainingAreaM2: geometry.usableAreaM2 - occupied,
    modulesPerString: s.modulesPerString,
    stringCount: s.stringCount,
    stringsPerMppt:
      s.stringCount / Math.max(1, inverter.mpptCount * Math.max(1, s.inverterQuantity)),
  };
}

/** Nombre de modules suggéré à partir de la consommation et du rendement spécifique. */
export function suggestModuleCount(
  annualConsumptionKwh: number,
  specificYieldKwhKwp: number,
  modulePmaxW: number,
  coverageRatio = 1,
): number {
  if (specificYieldKwhKwp <= 0 || modulePmaxW <= 0) return 0;
  const targetKwp = (annualConsumptionKwh * coverageRatio) / specificYieldKwhKwp;
  return Math.max(1, Math.round((targetKwp * 1000) / modulePmaxW));
}

/* ------------------------------------------------------------------ */
/* Configuration des chaînes (strings) — vérifications électriques     */
/* ------------------------------------------------------------------ */

export interface StringResult {
  vocMaxV: number; // Voc à température minimale
  vmpMinV: number; // Vmp à température cellule maximale
  vmpStcV: number;
  stringCurrentA: number;
  currentPerMpptA: number;
  stringsPerMppt: number;
  dcPowerPerInverterKw: number;
}

export function computeStrings(
  project: Project,
  module: PvModule,
  inverter: Inverter,
  sizing: SizingResult,
): StringResult {
  const s = project.selection;
  const n = Math.max(1, s.modulesPerString);
  const dTmin = s.minAmbientTempC - 25;
  const dTmax = s.maxCellTempC - 25;
  const vocMax = n * module.vocV * (1 + (module.tempCoefVocPctC / 100) * dTmin);
  const vmpMin = n * module.vmpV * (1 + (module.tempCoefVocPctC / 100) * dTmax);
  const invCount = Math.max(1, s.inverterQuantity);
  const stringsPerMppt = s.stringCount / Math.max(1, inverter.mpptCount * invCount);
  return {
    vocMaxV: vocMax,
    vmpMinV: vmpMin,
    vmpStcV: n * module.vmpV,
    stringCurrentA: module.impA,
    currentPerMpptA: module.impA * Math.ceil(stringsPerMppt),
    stringsPerMppt,
    dcPowerPerInverterKw: sizing.dcPowerKwp / invCount,
  };
}

/* ------------------------------------------------------------------ */
/* Production énergétique                                              */
/* ------------------------------------------------------------------ */

export interface EnergyResult {
  totalLossFactor: number; // fraction restante (0-1)
  totalLossPct: number;
  referenceYieldH: number; // H_POA / 1000 (heures équivalentes)
  specificYieldKwhKwp: number;
  annualProductionKwh: number;
  monthlyProductionKwh: number[];
  performanceRatio: number | null;
}

export function computeEnergy(project: Project, sizing: SizingResult): EnergyResult {
  const l = project.losses;
  const factors = [
    l.temperaturePct,
    l.soilingPct,
    l.mismatchPct,
    l.dcWiringPct,
    l.acWiringPct,
    l.inverterPct,
    l.availabilityPct,
    l.shadingPct,
    l.otherPct,
  ];
  const lossFactor = factors.reduce((acc, p) => acc * (1 - clamp(safe(p), 0, 100) / 100), 1);

  const irr = project.irradiation;
  // Y_r [h] = H_POA [kWh/m²] / G_STC [1 kW/m²]
  const referenceYield = irr.poaKwhM2Year;

  let specificYield: number;
  let pr: number | null;
  if (irr.method === "poa") {
    specificYield = referenceYield * lossFactor;
    pr = lossFactor;
  } else {
    specificYield = irr.specificYieldKwhKwp;
    pr = referenceYield > 0 ? specificYield / referenceYield : null;
  }

  const annual = sizing.dcPowerKwp * specificYield;
  const monthly = GENERIC_MONTHLY_IRRADIATION_SHARE.map((s) => annual * s);

  return {
    totalLossFactor: lossFactor,
    totalLossPct: (1 - lossFactor) * 100,
    referenceYieldH: referenceYield,
    specificYieldKwhKwp: specificYield,
    annualProductionKwh: annual,
    monthlyProductionKwh: monthly,
    performanceRatio: pr,
  };
}

/* ------------------------------------------------------------------ */
/* Autoconsommation et échanges réseau (bilan mensuel simplifié)       */
/* ------------------------------------------------------------------ */

export interface SelfConsumptionResult {
  monthlySelfConsumedKwh: number[];
  monthlyImportKwh: number[];
  monthlyExportKwh: number[];
  monthlyBatteryKwh: number[];
  selfConsumedKwh: number;
  importKwh: number;
  exportKwh: number;
  batteryDischargedKwh: number;
  selfConsumptionRatio: number; // part de la production consommée sur site
  selfSufficiencyRatio: number; // part de la consommation couverte par le PV
}

/**
 * Bilan mensuel simplifié : un facteur de simultanéité représente la part de
 * la production directement consommée en l'absence de stockage. La batterie
 * déplace ensuite une partie du surplus, limitée par sa capacité utile.
 */
export function computeSelfConsumption(
  project: Project,
  consumption: ConsumptionResult,
  energy: EnergyResult,
): SelfConsumptionResult {
  const simultaneity =
    project.info.type === "residentiel"
      ? 0.35
      : project.info.type === "agricole"
        ? 0.55
        : 0.65;

  const usableBatteryKwh =
    project.battery.mode === "aucune"
      ? 0
      : (project.battery.nominalKwh * clamp(project.battery.dodPct, 0, 100)) / 100;
  const roundTrip = clamp(project.battery.roundTripPct, 0, 100) / 100;

  const selfDirect: number[] = [];
  const battery: number[] = [];
  const imports: number[] = [];
  const exports: number[] = [];

  energy.monthlyProductionKwh.forEach((prod, i) => {
    const load = consumption.monthlyKwh[i] ?? 0;
    const direct = Math.min(load, prod * simultaneity, prod);
    let surplus = prod - direct;
    const residual = load - direct;

    const batteryCapMonth = usableBatteryKwh * (DAYS_IN_MONTH[i] ?? 30) * roundTrip;
    const stored = Math.min(surplus, residual, batteryCapMonth);

    surplus -= stored;
    selfDirect.push(direct);
    battery.push(stored);
    imports.push(Math.max(0, residual - stored));
    exports.push(Math.max(0, surplus));
  });

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const selfTotal = sum(selfDirect) + sum(battery);
  const production = sum(energy.monthlyProductionKwh);

  return {
    monthlySelfConsumedKwh: selfDirect.map((d, i) => d + (battery[i] ?? 0)),
    monthlyImportKwh: imports,
    monthlyExportKwh: exports,
    monthlyBatteryKwh: battery,
    selfConsumedKwh: selfTotal,
    importKwh: sum(imports),
    exportKwh: sum(exports),
    batteryDischargedKwh: sum(battery),
    selfConsumptionRatio: production > 0 ? selfTotal / production : 0,
    selfSufficiencyRatio:
      consumption.annualKwh > 0 ? selfTotal / consumption.annualKwh : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Batterie                                                            */
/* ------------------------------------------------------------------ */

export interface BatteryResult {
  recommendedNominalKwh: number;
  usableKwh: number;
  autonomyHours: number;
  cyclesPerYear: number;
}

export function computeBattery(
  project: Project,
  consumption: ConsumptionResult,
  self: SelfConsumptionResult,
): BatteryResult {
  const dod = clamp(project.battery.dodPct, 10, 100) / 100;
  const nightShare = 0.45; // hypothèse : part de la consommation hors production
  const recommended = (consumption.averageDailyKwh * nightShare) / dod;
  const usable =
    project.battery.mode === "aucune" ? 0 : project.battery.nominalKwh * dod;
  return {
    recommendedNominalKwh: recommended,
    usableKwh: usable,
    autonomyHours:
      consumption.averageDailyKwh > 0 ? (usable / consumption.averageDailyKwh) * 24 : 0,
    cyclesPerYear: usable > 0 ? self.batteryDischargedKwh / usable : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Analyse économique                                                  */
/* ------------------------------------------------------------------ */

export interface FinanceResult {
  capex: number;
  capexPerWp: number;
  annualSavingsYear1: number;
  opexAnnual: number;
  netSavingsYear1: number;
  simplePaybackYears: number | null;
  lifetimeSavings: number;
  roiPct: number;
  cashflow: { year: number; net: number; cumulative: number }[];
}

export function computeFinance(
  project: Project,
  self: SelfConsumptionResult,
): FinanceResult {
  const e = project.economics;
  const capex =
    safe(e.costModules) +
    safe(e.costInverter) +
    safe(e.costStructure) +
    safe(e.costProtection) +
    safe(e.costInstallation) +
    safe(e.costEngineering) +
    (project.battery.mode === "aucune" ? 0 : safe(e.costBattery)) +
    safe(e.costOther);

  const tariff = safe(project.info.tariff);
  const savingsY1 = self.selfConsumedKwh * tariff + self.exportKwh * safe(e.exportTariff);
  const net1 = savingsY1 - safe(e.opexAnnual);

  const cashflow: { year: number; net: number; cumulative: number }[] = [];
  let cumulative = -capex;
  let payback: number | null = null;

  for (let year = 1; year <= Math.max(1, Math.round(e.lifetimeYears)); year++) {
    const degradation = Math.pow(1 - safe(e.degradationPctYear) / 100, year - 1);
    const escalation = Math.pow(1 + safe(e.tariffEscalationPct) / 100, year - 1);
    const net =
      (self.selfConsumedKwh * tariff + self.exportKwh * safe(e.exportTariff)) *
        degradation *
        escalation -
      safe(e.opexAnnual);
    const previous = cumulative;
    cumulative += net;
    if (payback === null && previous < 0 && cumulative >= 0 && net > 0) {
      payback = year - 1 + -previous / net;
    }
    cashflow.push({ year, net, cumulative });
  }

  const lifetimeSavings = cumulative + capex;

  return {
    capex,
    capexPerWp: capex,
    annualSavingsYear1: savingsY1,
    opexAnnual: safe(e.opexAnnual),
    netSavingsYear1: net1,
    simplePaybackYears: payback,
    lifetimeSavings,
    roiPct: capex > 0 ? ((lifetimeSavings - capex) / capex) * 100 : 0,
    cashflow,
  };
}

/* ------------------------------------------------------------------ */
/* Environnement                                                       */
/* ------------------------------------------------------------------ */

export interface EnvironmentResult {
  annualCo2AvoidedKg: number;
  lifetimeCo2AvoidedT: number;
}

export function computeEnvironment(
  project: Project,
  energy: EnergyResult,
): EnvironmentResult {
  const annual = energy.annualProductionKwh * safe(project.environment.emissionFactorKgPerKwh);
  return {
    annualCo2AvoidedKg: annual,
    lifetimeCo2AvoidedT: (annual * Math.max(1, project.economics.lifetimeYears)) / 1000,
  };
}

/* ------------------------------------------------------------------ */
/* Vérifications d'ingénierie                                          */
/* ------------------------------------------------------------------ */

export function runChecks(
  project: Project,
  module: PvModule,
  inverter: Inverter,
  sizing: SizingResult,
  strings: StringResult,
  geometry: GeometryResult,
  energy: EnergyResult,
): EngineeringCheck[] {
  const checks: EngineeringCheck[] = [];
  const s = project.selection;
  const invCount = Math.max(1, s.inverterQuantity);

  checks.push(
    strings.vocMaxV > inverter.maxDcVoltageV
      ? {
          id: "voc-max",
          label: "Tension de chaîne à température minimale",
          status: "error",
          detail: `La tension à vide de la chaîne à ${project.selection.minAmbientTempC} °C dépasse la tension DC maximale de l'onduleur. Réduire le nombre de modules par chaîne.`,
          value: `${strings.vocMaxV.toFixed(0)} V`,
          limit: `≤ ${inverter.maxDcVoltageV} V`,
        }
      : strings.vocMaxV > inverter.maxDcVoltageV * 0.95
        ? {
            id: "voc-max",
            label: "Tension de chaîne à température minimale",
            status: "warning",
            detail:
              "La tension à vide corrigée en température est proche de la limite DC de l'onduleur (> 95 %). Marge de sécurité faible.",
            value: `${strings.vocMaxV.toFixed(0)} V`,
            limit: `≤ ${inverter.maxDcVoltageV} V`,
          }
        : {
            id: "voc-max",
            label: "Tension de chaîne à température minimale",
            status: "ok",
            detail: "La tension à vide corrigée en température reste sous la limite DC de l'onduleur.",
            value: `${strings.vocMaxV.toFixed(0)} V`,
            limit: `≤ ${inverter.maxDcVoltageV} V`,
          },
  );

  const mpptOk =
    strings.vmpMinV >= inverter.mpptVminV && strings.vmpStcV <= inverter.mpptVmaxV;
  checks.push({
    id: "mppt-range",
    label: "Tension de fonctionnement dans la plage MPPT",
    status: mpptOk ? "ok" : "error",
    detail: mpptOk
      ? "La tension de fonctionnement de la chaîne reste dans la plage MPPT de l'onduleur."
      : `La tension de fonctionnement de la chaîne sort de la plage MPPT (${inverter.mpptVminV}–${inverter.mpptVmaxV} V). Ajuster le nombre de modules par chaîne.`,
    value: `${strings.vmpMinV.toFixed(0)} – ${strings.vmpStcV.toFixed(0)} V`,
    limit: `${inverter.mpptVminV} – ${inverter.mpptVmaxV} V`,
  });

  const currentOk = strings.currentPerMpptA <= inverter.maxInputCurrentA;
  checks.push({
    id: "mppt-current",
    label: "Courant d'entrée par MPPT",
    status: currentOk ? "ok" : "error",
    detail: currentOk
      ? "Le courant d'entrée par MPPT respecte la limite de l'onduleur."
      : "Le courant d'entrée dépasse la limite du MPPT sélectionné. Réduire le nombre de chaînes en parallèle par MPPT.",
    value: `${strings.currentPerMpptA.toFixed(1)} A`,
    limit: `≤ ${inverter.maxInputCurrentA} A`,
  });

  const maxStrings = inverter.mpptCount * inverter.maxStringsPerMppt * invCount;
  checks.push({
    id: "strings-count",
    label: "Nombre de chaînes par MPPT",
    status: s.stringCount <= maxStrings ? "ok" : "error",
    detail:
      s.stringCount <= maxStrings
        ? "Le nombre de chaînes est compatible avec le nombre d'entrées MPPT disponibles."
        : "Le nombre de chaînes dépasse la capacité d'entrée des onduleurs (MPPT × chaînes par MPPT).",
    value: `${s.stringCount} chaînes`,
    limit: `≤ ${maxStrings} chaînes`,
  });

  const dcRatio = sizing.dcAcRatio;
  checks.push({
    id: "dc-ac",
    label: "Ratio DC/AC",
    status: dcRatio >= 0.9 && dcRatio <= 1.4 ? "ok" : "warning",
    detail:
      dcRatio >= 0.9 && dcRatio <= 1.4
        ? "Le ratio DC/AC se situe dans une plage d'ingénierie courante. Le ratio optimal dépend du climat, de l'orientation, de la stratégie d'écrêtage et des objectifs du projet."
        : "Le ratio DC/AC sort de la plage d'ingénierie courante (0,90–1,40). Vérifier la stratégie d'écrêtage et les caractéristiques de l'onduleur retenues.",
    value: dcRatio.toFixed(2),
    limit: "0,90 – 1,40 (plage indicative)",
  });

  const dcPerInverter = sizing.dcPowerKwp / invCount;
  checks.push({
    id: "dc-max",
    label: "Puissance DC maximale admissible par onduleur",
    status: dcPerInverter <= inverter.maxDcPowerKw ? "ok" : "warning",
    detail:
      dcPerInverter <= inverter.maxDcPowerKw
        ? "La puissance DC installée par onduleur respecte la puissance DC maximale admissible."
        : "La puissance DC installée par onduleur dépasse la puissance DC maximale admissible indiquée.",
    value: `${dcPerInverter.toFixed(1)} kWc`,
    limit: `≤ ${inverter.maxDcPowerKw} kW`,
  });

  checks.push({
    id: "surface",
    label: "Capacité géométrique de la zone",
    status:
      sizing.moduleCount <= geometry.maxModulesByArea
        ? "ok"
        : "error",
    detail:
      sizing.moduleCount <= geometry.maxModulesByArea
        ? "Le nombre de modules de la configuration électrique tient dans la surface exploitable déclarée."
        : "Le nombre de modules dépasse la capacité géométrique de la surface exploitable déclarée.",
    value: `${sizing.moduleCount} modules`,
    limit: `≤ ${geometry.maxModulesByArea} modules`,
  });

  if (energy.performanceRatio !== null) {
    const pr = energy.performanceRatio;
    checks.push({
      id: "pr",
      label: "Ratio de performance (PR)",
      status: pr >= 0.7 && pr <= 0.9 ? "ok" : "warning",
      detail:
        pr >= 0.7 && pr <= 0.9
          ? "Le PR résultant des pertes saisies se situe dans une plage courante pour une installation raccordée au réseau."
          : "Le PR résultant sort de la plage courante (0,70–0,90). Vérifier la cohérence des pertes et de l'irradiation saisies.",
      value: pr.toFixed(2),
      limit: "0,70 – 0,90 (plage indicative)",
    });
  }

  if (project.irradiation.source.trim() === "") {
    checks.push({
      id: "source",
      label: "Source de la donnée d'irradiation",
      status: "warning",
      detail:
        "Aucune source d'irradiation n'est renseignée. Indiquer la base de données utilisée (PVGIS, Meteonorm, Solargis, mesures sur site).",
    });
  }

  if (module.demo || inverter.demo) {
    checks.push({
      id: "demo-data",
      label: "Origine des caractéristiques d'équipement",
      status: "warning",
      detail:
        "La configuration utilise des équipements de démonstration. Remplacer par des fiches techniques constructeur avant toute décision d'ingénierie.",
    });
  }

  return checks;
}

/* ------------------------------------------------------------------ */
/* Étude complète                                                      */
/* ------------------------------------------------------------------ */

export interface StudyResult {
  module: PvModule;
  inverter: Inverter;
  consumption: ConsumptionResult;
  geometry: GeometryResult;
  sizing: SizingResult;
  strings: StringResult;
  energy: EnergyResult;
  self: SelfConsumptionResult;
  battery: BatteryResult;
  finance: FinanceResult;
  environment: EnvironmentResult;
  checks: EngineeringCheck[];
}

export function runStudy(project: Project): StudyResult {
  const module = getModule(project.selection.moduleId);
  const inverter = getInverter(project.selection.inverterId);
  const consumption = computeConsumption(project);
  const geometry = computeGeometry(project, module);
  const sizing = computeSizing(project, module, inverter, geometry);
  const strings = computeStrings(project, module, inverter, sizing);
  const energy = computeEnergy(project, sizing);
  const self = computeSelfConsumption(project, consumption, energy);
  const battery = computeBattery(project, consumption, self);
  const finance = computeFinance(project, self);
  const environment = computeEnvironment(project, energy);
  const checks = runChecks(project, module, inverter, sizing, strings, geometry, energy);

  return {
    module,
    inverter,
    consumption,
    geometry,
    sizing,
    strings,
    energy,
    self,
    battery,
    finance,
    environment,
    checks,
  };
}
