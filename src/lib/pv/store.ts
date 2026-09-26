/**
 * Persistance locale des projets (navigateur).
 * L'interface passe par ces fonctions uniquement : un backend (base de
 * données + comptes utilisateurs) peut remplacer cette couche sans toucher
 * au reste de l'application.
 */

import { useCallback, useEffect, useState } from "react";
import type { CableInput, LayoutInput, Project, SiteInput } from "./types";

export const DEFAULT_SITE: SiteInput = { label: "Casablanca, Maroc", altitudeM: null, polygon: [] };
export const DEFAULT_LAYOUT: LayoutInput = {
  orientation: "portrait",
  mode: "max-modules",
  setbackM: 0.5,
  moduleGapM: 0.02,
  rowSpacingM: 0.8,
  corridorEveryRows: 0,
  corridorWidthM: 1,
  rowAngleDeg: null,
};
export const DEFAULT_CABLES: CableInput = {
  dcLengthM: 25,
  acLengthM: 15,
  material: "cuivre",
  method: "C",
  ambientC: 40,
  groupedCircuits: 1,
  maxDropDcPct: 1.5,
  maxDropAcPct: 1.5,
};

/** Complète les projets enregistrés avant l'ajout des blocs site / calepinage / câbles. */
function migrate(p: Project): Project {
  return {
    ...p,
    site: { ...DEFAULT_SITE, ...(p.site ?? {}) },
    layout: { ...DEFAULT_LAYOUT, ...(p.layout ?? {}) },
    cables: { ...DEFAULT_CABLES, ...(p.cables ?? {}) },
  };
}

const STORAGE_KEY = "solara.projects.v1";
const ACTIVE_KEY = "solara.activeProject.v1";
const EVENT = "solara:projects-changed";

export function createEmptyProject(partial?: Partial<Project>): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    isDemo: false,
    status: "brouillon",
    info: {
      name: "Nouveau projet",
      type: "residentiel",
      country: "Maroc",
      city: "",
      latitude: 33.5731,
      longitude: -7.5898,
      address: "",
      gridConnection: "raccorde",
      tariff: 1.4,
      currency: "MAD",
    },
    consumption: {
      mode: "annuelle",
      annualKwh: 9000,
      monthlyKwh: [760, 690, 720, 700, 730, 800, 880, 865, 755, 730, 710, 675],
      quality: "estimee",
      hourlyProfile: null,
    },
    area: {
      installationType: "toiture",
      availableAreaM2: 80,
      roofLengthM: 10,
      roofWidthM: 8,
      tiltDeg: 20,
      azimuthDeg: 0,
      shadingLossPct: 3,
      usableAreaFactorPct: 75,
    },
    selection: {
      moduleId: "mod-demo-500-topcon",
      inverterId: "inv-demo-5k-1ph",
      inverterQuantity: 1,
      modulesPerString: 10,
      stringCount: 1,
      minAmbientTempC: -5,
      maxCellTempC: 70,
    },
    irradiation: {
      method: "poa",
      poaKwhM2Year: 2000,
      specificYieldKwhKwp: 1600,
      source: "À renseigner (PVGIS / Meteonorm / Solargis / mesures sur site)",
    },
    losses: {
      temperaturePct: 8,
      soilingPct: 3,
      mismatchPct: 2,
      dcWiringPct: 1.5,
      acWiringPct: 1,
      inverterPct: 2,
      availabilityPct: 1,
      shadingPct: 3,
      otherPct: 1,
    },
    battery: {
      mode: "aucune",
      nominalKwh: 10,
      dodPct: 90,
      roundTripPct: 92,
      maxChargeKw: 5,
      maxDischargeKw: 5,
      cycleLife: 6000,
      autonomyTargetDays: 0.5,
    },
    economics: {
      costModules: 25000,
      costInverter: 9000,
      costStructure: 6000,
      costProtection: 4000,
      costInstallation: 8000,
      costEngineering: 3000,
      costBattery: 0,
      costOther: 2000,
      opexAnnual: 800,
      tariffEscalationPct: 2,
      lifetimeYears: 25,
      degradationPctYear: 0.5,
      exportTariff: 0,
    },
    environment: {
      emissionFactorKgPerKwh: 0.7,
      source: "Facteur d'émission à renseigner selon le mix électrique national",
    },
    site: { ...DEFAULT_SITE },
    layout: { ...DEFAULT_LAYOUT },
    cables: { ...DEFAULT_CABLES },
    ...partial,
  };
}

export function createDemoProject(): Project {
  const base = createEmptyProject();
  return {
    ...base,
    id: "demo-villa-casablanca",
    isDemo: true,
    status: "calcule",
    info: {
      ...base.info,
      name: "Villa Casablanca — Démonstration",
      city: "Casablanca",
      address: "Adresse de démonstration",
      tariff: 1.4,
    },
    consumption: {
      ...base.consumption,
      mode: "mensuelle",
      annualKwh: 9010,
      quality: "estimee",
    },
    selection: {
      ...base.selection,
      moduleId: "mod-demo-500-topcon",
      inverterId: "inv-demo-5k-1ph",
      modulesPerString: 10,
      stringCount: 1,
    },
    economics: { ...base.economics },
  };
}

function read(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = [createDemoProject()];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return (JSON.parse(raw) as Project[]).map(migrate);
  } catch {
    return [];
  }
}

function write(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new Event(EVENT));
}

export function listProjects(): Project[] {
  return read();
}

export function getProject(id: string): Project | undefined {
  return read().find((p) => p.id === id);
}

export function saveProject(project: Project) {
  const projects = read();
  const updated = { ...project, updatedAt: new Date().toISOString() };
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) projects[index] = updated;
  else projects.unshift(updated);
  write(projects);
}

export function deleteProject(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function duplicateProject(id: string): Project | undefined {
  const source = getProject(id);
  if (!source) return undefined;
  const copy: Project = {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    info: { ...source.info, name: `${source.info.name} (copie)` },
  };
  saveProject(copy);
  return copy;
}

export function setActiveProjectId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new Event(EVENT));
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const sync = () => setProjects(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return projects;
}

/** Projet actif du plan de travail (assistant / résultats / rapport). */
export function useActiveProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const all = read();
      const id = getActiveProjectId();
      const found = (id && all.find((p) => p.id === id)) || all[0] || null;
      setProject(found ?? null);
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const update = useCallback((updater: (p: Project) => Project) => {
    setProject((current) => {
      if (!current) return current;
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      const projects = read();
      const index = projects.findIndex((p) => p.id === next.id);
      if (index >= 0) projects[index] = next;
      else projects.unshift(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      }
      return next;
    });
  }, []);

  return { project, update, ready };
}
