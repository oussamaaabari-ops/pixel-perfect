// Construction du dossier de revue de conception envoyé au modèle (pur, sans UI).
import type { StudyResult } from "./calc";
import type { Project } from "./types";

export function buildReviewDossier(project: Project, study: StudyResult) {
  const { modules: _placed, polygon: _poly, ...layout } = study.layout;
  return {
    projet: { nom: project.info.name, type: project.info.type, pays: project.info.country, ville: project.info.city, raccordement: project.info.gridConnection },
    site: { ...project.site, polygonVertexCount: project.site.polygon.length, polygon: undefined },
    zone: project.area,
    parametresCalepinage: project.layout,
    parametresCables: project.cables,
    selection: project.selection,
    module: study.module,
    onduleur: study.inverter,
    resultats: {
      dimensionnement: study.sizing,
      chaines: study.strings,
      calepinage: layout,
      contexteElectrique: study.electrical,
      protections: study.protections,
      cables: study.cables,
      productionAnnuelleKwh: study.energy.annualProductionKwh,
      rendementSpecifique: study.energy.specificYieldKwhKwp,
      pr: study.energy.performanceRatio,
    },
    verifications: study.checks.map((c) => ({ id: c.id, statut: c.status, libelle: c.label, detail: c.detail, valeur: c.value, limite: c.limit })),
  };
}

const KEY = (id: string) => `solara.review.v1.${id}`;
export interface StoredReview { text: string; at: string }
export function loadReview(id: string): StoredReview | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY(id)) || "null"); } catch { return null; }
}
export function saveReview(id: string, r: StoredReview) {
  localStorage.setItem(KEY(id), JSON.stringify(r));
}
