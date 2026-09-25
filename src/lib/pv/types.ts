/**
 * Modèle de données du moteur de pré-dimensionnement PV.
 * Aucune logique de calcul ici — uniquement les structures.
 */

export type Currency = "MAD" | "EUR" | "USD";

export type ProjectType = "residentiel" | "commercial" | "industriel" | "agricole" | "autre";
export type GridConnection = "raccorde" | "hors-reseau" | "hybride";
export type InstallationType = "toiture" | "sol" | "ombriere" | "autre";
export type ConsumptionMode = "annuelle" | "mensuelle";
export type DataQuality = "estimee" | "mesuree";
export type IrradiationMethod = "poa" | "rendement";
export type BatteryMode = "aucune" | "personnalisee" | "recommandee";

export type ModuleTechnology =
  | "Mono PERC P-type"
  | "N-type TOPCon"
  | "HJT"
  | "Back-contact / ABC"
  | "Autre";

export interface PvModule {
  id: string;
  manufacturer: string;
  model: string;
  technology: ModuleTechnology;
  pmaxW: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  tempCoefVocPctC: number; // %/°C (négatif)
  tempCoefPmaxPctC: number; // %/°C (négatif)
  lengthMm: number;
  widthMm: number;
  efficiencyPct: number;
  stc: string;
  demo: boolean;
  source?: string;
}

export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  acPowerKw: number;
  maxDcPowerKw: number;
  mpptVminV: number;
  mpptVmaxV: number;
  maxDcVoltageV: number;
  maxInputCurrentA: number; // par MPPT
  mpptCount: number;
  maxStringsPerMppt: number;
  efficiencyPct: number;
  phases: 1 | 3;
  demo: boolean;
  source?: string;
}

export interface BatteryProduct {
  id: string;
  manufacturer: string;
  model: string;
  nominalKwh: number;
  dodPct: number;
  roundTripPct: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  cycleLife: number;
  demo: boolean;
}

export interface MountingStructure {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
  material: string;
  maxTiltDeg: number;
  demo: boolean;
}

export interface ProjectInfo {
  name: string;
  type: ProjectType;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  gridConnection: GridConnection;
  tariff: number; // devise / kWh
  currency: Currency;
}

export interface ConsumptionInput {
  mode: ConsumptionMode;
  annualKwh: number;
  monthlyKwh: number[]; // 12 valeurs
  quality: DataQuality;
  /** Réservé : profil horaire (8760) pour une version ultérieure. */
  hourlyProfile?: number[] | null;
}

export interface AreaInput {
  installationType: InstallationType;
  availableAreaM2: number;
  roofLengthM: number;
  roofWidthM: number;
  tiltDeg: number;
  azimuthDeg: number; // 0 = Sud, -90 = Est, +90 = Ouest
  shadingLossPct: number;
  usableAreaFactorPct: number; // circulation, acrotères, espacement
}

export interface SystemSelection {
  moduleId: string;
  inverterId: string;
  inverterQuantity: number;
  modulesPerString: number;
  stringCount: number;
  minAmbientTempC: number;
  maxCellTempC: number;
}

export interface IrradiationInput {
  method: IrradiationMethod;
  poaKwhM2Year: number; // irradiation dans le plan des modules
  specificYieldKwhKwp: number; // rendement spécifique saisi directement
  source: string;
}

export interface LossesInput {
  temperaturePct: number;
  soilingPct: number;
  mismatchPct: number;
  dcWiringPct: number;
  acWiringPct: number;
  inverterPct: number;
  availabilityPct: number;
  shadingPct: number;
  otherPct: number;
}

export interface BatteryInput {
  mode: BatteryMode;
  nominalKwh: number;
  dodPct: number;
  roundTripPct: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  cycleLife: number;
  autonomyTargetDays: number;
}

export interface EconomicsInput {
  costModules: number;
  costInverter: number;
  costStructure: number;
  costProtection: number;
  costInstallation: number;
  costEngineering: number;
  costBattery: number;
  costOther: number;
  opexAnnual: number;
  tariffEscalationPct: number;
  lifetimeYears: number;
  degradationPctYear: number;
  exportTariff: number;
}

export interface EnvironmentInput {
  emissionFactorKgPerKwh: number;
  source: string;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
  status: "brouillon" | "calcule";
  info: ProjectInfo;
  consumption: ConsumptionInput;
  area: AreaInput;
  selection: SystemSelection;
  irradiation: IrradiationInput;
  losses: LossesInput;
  battery: BatteryInput;
  economics: EconomicsInput;
  environment: EnvironmentInput;
  site: SiteInput;
  layout: LayoutInput;
  cables: CableInput;
}

export type CheckStatus = "ok" | "warning" | "error";

export interface EngineeringCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  value?: string;
  limit?: string;
}

/* ------------------------------------------------------------------ */
/* Site, calepinage, protections, câbles (v2)                          */
/* ------------------------------------------------------------------ */

export type LatLng = [number, number];

/**
 * Localisation et emprise du site. Les champs `imagery*`, `buildingFootprintId`
 * et `elevationModel` sont réservés aux intégrations futures (imagerie
 * satellite, détection de toiture, MNT, ombrages 3D).
 */
export interface SiteInput {
  label: string;
  altitudeM: number | null;
  polygon: LatLng[]; // emprise d'implantation dessinée sur la carte
  imagerySource?: string | undefined;
  buildingFootprintId?: string | undefined;
  elevationModel?: string | undefined;
}

export type ModuleOrientation = "portrait" | "paysage";
export type LayoutMode = "max-modules" | "max-puissance" | "espacement-optimise";

export interface LayoutInput {
  orientation: ModuleOrientation;
  mode: LayoutMode;
  setbackM: number; // retrait en bordure
  moduleGapM: number; // jeu entre modules d'une rangée
  rowSpacingM: number; // allée libre entre rangées
  corridorEveryRows: number; // 0 = aucune allée de maintenance
  corridorWidthM: number;
  /** Angle d'alignement des rangées (° depuis l'Est, sens trigonométrique). null = arête la plus longue. */
  rowAngleDeg: number | null;
}

export type ConductorMaterial = "cuivre" | "aluminium";
export type InstallMethod = "B1" | "C" | "E";

export interface CableInput {
  dcLengthM: number; // longueur aller chaîne → onduleur
  acLengthM: number; // longueur onduleur → TGBT
  material: ConductorMaterial;
  method: InstallMethod;
  ambientC: number;
  groupedCircuits: number;
  maxDropDcPct: number;
  maxDropAcPct: number;
}
