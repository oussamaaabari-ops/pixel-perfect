import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NumberField, SelectField, TextField } from "@/components/pv/fields";
import { CheckList, DataRow, DemoBadge, Kpi, Section } from "@/components/pv/primitives";
import { runStudy, suggestModuleCount } from "@/lib/pv/calc";
import { DEMO_BATTERIES, DEMO_INVERTERS, DEMO_MODULES } from "@/lib/pv/equipment";
import { MONTHS_FR, MONTHS_FR_LONG, money, num, pct } from "@/lib/pv/format";
import {
  createEmptyProject,
  saveProject,
  setActiveProjectId,
  useActiveProject,
} from "@/lib/pv/store";
import type { Project } from "@/lib/pv/types";

export const Route = createFileRoute("/etude")({
  head: () => ({
    meta: [
      { title: "Pré-dimensionnement PV — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Assistant d'ingénierie en 8 étapes : projet, consommation, zone d'implantation, module, onduleur, chaînes, production et économie.",
      },
      { property: "og:title", content: "Assistant de pré-dimensionnement photovoltaïque" },
      {
        property: "og:description",
        content:
          "Saisie guidée avec unités, validations et vérifications électriques en temps réel.",
      },
    ],
  }),
  component: Etude,
});

const STEPS = [
  "Projet",
  "Consommation",
  "Zone d'implantation",
  "Module PV",
  "Onduleur",
  "Chaînes",
  "Production",
  "Stockage & économie",
];

function Etude() {
  const { project, update, ready } = useActiveProject();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const study = useMemo(() => (project ? runStudy(project) : null), [project]);

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!project || !study) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Aucun projet actif</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Créez une étude pour démarrer le pré-dimensionnement.
        </p>
        <button
          type="button"
          onClick={() => {
            const p = createEmptyProject();
            saveProject(p);
            setActiveProjectId(p.id);
          }}
          className="mt-6 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          Créer une étude
        </button>
      </div>
    );
  }

  const set = <K extends keyof Project>(key: K, value: Partial<Project[K]>) =>
    update((p) => ({ ...p, [key]: { ...(p[key] as object), ...value } as Project[K] }));

  const currency = project.info.currency;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Assistant d'ingénierie · étape {step + 1} / {STEPS.length}</p>
          <h1 className="mt-2 text-2xl font-bold">{project.info.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {project.isDemo && <DemoBadge>DÉMO — USAGE NON PROFESSIONNEL</DemoBadge>}
          <Link
            to="/resultats"
            className="rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary"
          >
            Voir les résultats
          </Link>
        </div>
      </header>

      {/* Progress rail */}
      <nav className="mt-6 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4 lg:grid-cols-8">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 bg-card px-3 py-2.5 text-left text-[12px] transition-colors ${
              i === step ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] ${
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                    ? "bg-accent text-accent-foreground"
                    : "border border-border"
              }`}
            >
              {i < step ? <Check className="size-3" /> : i + 1}
            </span>
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {step === 0 && (
            <Section title="1. Informations du projet" description="Identification, localisation et conditions de raccordement.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom du projet"
                  value={project.info.name}
                  onChange={(v) => set("info", { name: v })}
                />
                <SelectField
                  label="Type de projet"
                  value={project.info.type}
                  onChange={(v) => set("info", { type: v })}
                  options={[
                    { value: "residentiel", label: "Résidentiel" },
                    { value: "commercial", label: "Commercial / tertiaire" },
                    { value: "industriel", label: "Industriel" },
                    { value: "agricole", label: "Agricole" },
                    { value: "autre", label: "Autre" },
                  ]}
                />
                <TextField label="Pays" value={project.info.country} onChange={(v) => set("info", { country: v })} />
                <TextField label="Ville" value={project.info.city} onChange={(v) => set("info", { city: v })} />
                <NumberField
                  label="Latitude"
                  unit="°"
                  hint="Saisie manuelle. La sélection par carte pourra être ajoutée ultérieurement."
                  value={project.info.latitude}
                  min={-90}
                  max={90}
                  onChange={(v) => set("info", { latitude: v })}
                />
                <NumberField
                  label="Longitude"
                  unit="°"
                  value={project.info.longitude}
                  min={-180}
                  max={180}
                  onChange={(v) => set("info", { longitude: v })}
                />
                <div className="sm:col-span-2">
                  <TextField label="Adresse du projet" value={project.info.address} onChange={(v) => set("info", { address: v })} />
                </div>
                <SelectField
                  label="Type de raccordement"
                  value={project.info.gridConnection}
                  onChange={(v) => set("info", { gridConnection: v })}
                  options={[
                    { value: "raccorde", label: "Raccordé au réseau" },
                    { value: "hors-reseau", label: "Hors réseau" },
                    { value: "hybride", label: "Hybride" },
                  ]}
                />
                <SelectField
                  label="Devise"
                  value={currency}
                  onChange={(v) => set("info", { currency: v })}
                  options={[
                    { value: "MAD", label: "MAD — dirham marocain" },
                    { value: "EUR", label: "EUR — euro" },
                    { value: "USD", label: "USD — dollar américain" },
                  ]}
                />
                <NumberField
                  label="Tarif de l'électricité"
                  unit={`${currency}/kWh`}
                  hint="Tarif moyen appliqué à l'énergie autoconsommée."
                  value={project.info.tariff}
                  min={0}
                  onChange={(v) => set("info", { tariff: v })}
                />
              </div>
            </Section>
          )}

          {step === 1 && (
            <>
              <Section title="2. Consommation électrique" description="Saisie annuelle ou détail mensuel. L'import d'un profil horaire est prévu pour une version ultérieure.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField
                    label="Méthode de saisie"
                    value={project.consumption.mode}
                    onChange={(v) => set("consumption", { mode: v })}
                    options={[
                      { value: "annuelle", label: "A — Consommation annuelle" },
                      { value: "mensuelle", label: "B — Consommation mensuelle" },
                    ]}
                  />
                  <SelectField
                    label="Qualité de la donnée"
                    value={project.consumption.quality}
                    onChange={(v) => set("consumption", { quality: v })}
                    options={[
                      { value: "estimee", label: "Estimée" },
                      { value: "mesuree", label: "Mesurée (factures / comptage)" },
                    ]}
                  />
                  {project.consumption.mode === "annuelle" && (
                    <NumberField
                      label="Consommation annuelle"
                      unit="kWh/an"
                      value={project.consumption.annualKwh}
                      min={0}
                      onChange={(v) => set("consumption", { annualKwh: v })}
                    />
                  )}
                </div>

                {project.consumption.mode === "mensuelle" && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {MONTHS_FR_LONG.map((m, i) => (
                      <NumberField
                        key={m}
                        label={m}
                        unit="kWh"
                        value={project.consumption.monthlyKwh[i]}
                        min={0}
                        onChange={(v) => {
                          const monthly = [...project.consumption.monthlyKwh];
                          monthly[i] = v;
                          set("consumption", { monthlyKwh: monthly });
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Kpi label="Consommation annuelle" value={num(study.consumption.annualKwh)} unit="kWh/an" />
                  <Kpi label="Moyenne mensuelle" value={num(study.consumption.averageMonthlyKwh)} unit="kWh/mois" />
                  <Kpi label="Moyenne journalière" value={num(study.consumption.averageDailyKwh, 1)} unit="kWh/jour" />
                </div>
              </Section>

              <Section title="Répartition mensuelle de la consommation">
                <MonthlyChart
                  data={study.consumption.monthlyKwh}
                  label="Consommation"
                  color="var(--chart-2)"
                />
                {project.consumption.mode === "annuelle" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Répartition issue d'un profil de forme générique — hypothèse, à remplacer
                    par des relevés mensuels réels.
                  </p>
                )}
              </Section>
            </>
          )}

          {step === 2 && (
            <Section title="3. Zone d'implantation" description="La capacité géométrique de la zone est distincte de la capacité électrique du système.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SelectField
                  label="Type d'installation"
                  value={project.area.installationType}
                  onChange={(v) => set("area", { installationType: v })}
                  options={[
                    { value: "toiture", label: "Toiture" },
                    { value: "sol", label: "Au sol" },
                    { value: "ombriere", label: "Ombrière / carport" },
                    { value: "autre", label: "Autre" },
                  ]}
                />
                <NumberField
                  label="Surface disponible"
                  unit="m²"
                  hint="Si la valeur est nulle, la surface est calculée par longueur × largeur."
                  value={project.area.availableAreaM2}
                  min={0}
                  onChange={(v) => set("area", { availableAreaM2: v })}
                />
                <NumberField
                  label="Coefficient d'exploitation"
                  unit="%"
                  hint="Part de la surface réellement exploitable : circulation, acrotères, espacement entre rangées."
                  value={project.area.usableAreaFactorPct}
                  min={10}
                  max={100}
                  onChange={(v) => set("area", { usableAreaFactorPct: v })}
                />
                <NumberField label="Longueur de la zone" unit="m" value={project.area.roofLengthM} min={0} onChange={(v) => set("area", { roofLengthM: v })} />
                <NumberField label="Largeur de la zone" unit="m" value={project.area.roofWidthM} min={0} onChange={(v) => set("area", { roofWidthM: v })} />
                <NumberField
                  label="Inclinaison"
                  unit="°"
                  hint="0° = horizontal, 90° = vertical."
                  value={project.area.tiltDeg}
                  min={0}
                  max={90}
                  onChange={(v) => set("area", { tiltDeg: v })}
                />
                <NumberField
                  label="Azimut"
                  unit="°"
                  hint="0° = Sud, −90° = Est, +90° = Ouest."
                  value={project.area.azimuthDeg}
                  min={-180}
                  max={180}
                  onChange={(v) => set("area", { azimuthDeg: v })}
                />
                <NumberField
                  label="Ombrage estimé"
                  unit="%"
                  hint="Report dans les pertes d'ombrage à l'étape Production."
                  value={project.area.shadingLossPct}
                  min={0}
                  max={100}
                  onChange={(v) => set("area", { shadingLossPct: v, })}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <Kpi label="Surface exploitable" value={num(study.geometry.usableAreaM2, 1)} unit="m²" />
                <Kpi label="Capacité géométrique" value={num(study.geometry.maxModulesByArea)} unit="modules" />
                <Kpi label="Surface occupée" value={num(study.sizing.occupiedAreaM2, 1)} unit="m²" note="Configuration électrique actuelle" />
                <Kpi label="Surface restante" value={num(study.sizing.remainingAreaM2, 1)} unit="m²" />
              </div>

              <div className="mt-6">
                <p className="label-technical">Représentation schématique de l'implantation</p>
                <LayoutPreview
                  maxModules={study.geometry.maxModulesByArea}
                  used={study.sizing.moduleCount}
                />
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section
              title="4. Module photovoltaïque"
              description="Sélection dans la bibliothèque. Les caractéristiques sont celles des conditions STC."
              aside={<DemoBadge />}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {DEMO_MODULES.map((m) => {
                  const active = m.id === project.selection.moduleId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set("selection", { moduleId: m.id })}
                      className={`rounded-sm border p-4 text-left transition-colors ${
                        active ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold">{m.model}</p>
                        <p className="numeric text-sm">{m.pmaxW} Wc</p>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {m.manufacturer} · {m.technology} · {m.efficiencyPct} %
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 font-mono text-[11px] text-muted-foreground">
                        <div>Voc {m.vocV} V</div>
                        <div>Vmp {m.vmpV} V</div>
                        <div>Isc {m.iscA} A</div>
                        <div>Imp {m.impA} A</div>
                        <div>β Voc {m.tempCoefVocPctC} %/°C</div>
                        <div>β Pmax {m.tempCoefPmaxPctC} %/°C</div>
                        <div className="col-span-2">
                          {m.lengthMm} × {m.widthMm} mm
                        </div>
                      </dl>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Conditions STC : {study.module.stc}. Ces valeurs sont génériques et doivent
                être remplacées par les fiches techniques constructeur.
              </p>
            </Section>
          )}

          {step === 4 && (
            <Section
              title="5. Onduleur"
              description="Le ratio DC/AC approprié dépend du climat, de l'orientation, de la stratégie d'écrêtage et des objectifs du projet."
              aside={<DemoBadge />}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {DEMO_INVERTERS.map((inv) => {
                  const active = inv.id === project.selection.inverterId;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => set("selection", { inverterId: inv.id })}
                      className={`rounded-sm border p-4 text-left transition-colors ${
                        active ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold">{inv.model}</p>
                        <p className="numeric text-sm">{inv.acPowerKw} kW AC</p>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {inv.phases === 1 ? "Monophasé" : "Triphasé"} · η {inv.efficiencyPct} %
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 font-mono text-[11px] text-muted-foreground">
                        <div>P DC max {inv.maxDcPowerKw} kW</div>
                        <div>U DC max {inv.maxDcVoltageV} V</div>
                        <div>MPPT {inv.mpptVminV}–{inv.mpptVmaxV} V</div>
                        <div>I max {inv.maxInputCurrentA} A</div>
                        <div>{inv.mpptCount} MPPT</div>
                        <div>{inv.maxStringsPerMppt} chaîne(s)/MPPT</div>
                      </dl>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <NumberField
                  label="Nombre d'onduleurs"
                  unit="unité"
                  value={project.selection.inverterQuantity}
                  min={1}
                  step={1}
                  onChange={(v) => set("selection", { inverterQuantity: Math.round(v) })}
                />
                <Kpi label="Puissance AC totale" value={num(study.sizing.acPowerKw, 2)} unit="kW" />
                <Kpi label="Ratio DC/AC" value={num(study.sizing.dcAcRatio, 2)} note="Plage indicative 0,90 – 1,40" />
              </div>
            </Section>
          )}

          {step === 5 && (
            <>
              <Section title="6. Configuration des chaînes" description="Vérification des tensions et courants aux températures extrêmes du site.">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField
                    label="Modules par chaîne"
                    unit="unité"
                    value={project.selection.modulesPerString}
                    min={1}
                    step={1}
                    onChange={(v) => set("selection", { modulesPerString: Math.round(v) })}
                  />
                  <NumberField
                    label="Nombre de chaînes"
                    unit="unité"
                    value={project.selection.stringCount}
                    min={1}
                    step={1}
                    onChange={(v) => set("selection", { stringCount: Math.round(v) })}
                  />
                  <NumberField
                    label="Température ambiante minimale"
                    unit="°C"
                    hint="Utilisée pour la tension à vide maximale de la chaîne."
                    value={project.selection.minAmbientTempC}
                    min={-40}
                    max={30}
                    onChange={(v) => set("selection", { minAmbientTempC: v })}
                  />
                  <NumberField
                    label="Température cellule maximale"
                    unit="°C"
                    hint="Utilisée pour la tension de fonctionnement minimale."
                    value={project.selection.maxCellTempC}
                    min={25}
                    max={100}
                    onChange={(v) => set("selection", { maxCellTempC: v })}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const target = suggestModuleCount(
                      study.consumption.annualKwh,
                      study.energy.specificYieldKwhKwp || 1600,
                      study.module.pmaxW,
                    );
                    const perString = project.selection.modulesPerString || 10;
                    set("selection", { stringCount: Math.max(1, Math.round(target / perString)) });
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary"
                >
                  <Wand2 className="size-3.5" /> Proposer un nombre de chaînes couvrant la consommation
                </button>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <Kpi label="Modules au total" value={num(study.sizing.moduleCount)} unit="unités" />
                  <Kpi label="Puissance DC" value={num(study.sizing.dcPowerKwp, 2)} unit="kWc" />
                  <Kpi label="U_oc à T min" value={num(study.strings.vocMaxV, 0)} unit="V" />
                  <Kpi label="I par MPPT" value={num(study.strings.currentPerMpptA, 1)} unit="A" />
                </div>
              </Section>

              <Section title="Vérifications électriques" description="Aucune configuration non conforme n'est acceptée silencieusement.">
                <CheckList checks={study.checks} />
              </Section>
            </>
          )}

          {step === 6 && (
            <>
              <Section title="7. Irradiation et pertes" description="La source de la donnée d'irradiation doit être explicitement indiquée.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Méthode de calcul"
                    value={project.irradiation.method}
                    onChange={(v) => set("irradiation", { method: v })}
                    options={[
                      { value: "poa", label: "Irradiation dans le plan des modules (H_POA)" },
                      { value: "rendement", label: "Rendement spécifique saisi directement" },
                    ]}
                  />
                  <TextField
                    label="Source de la donnée d'irradiation"
                    value={project.irradiation.source}
                    onChange={(v) => set("irradiation", { source: v })}
                    placeholder="PVGIS / Meteonorm / Solargis / mesures sur site"
                  />
                  <NumberField
                    label="Irradiation dans le plan des modules"
                    unit="kWh/m²/an"
                    hint="H_POA. Valeur issue d'une base de données externe ; la plateforme ne génère aucune donnée météorologique."
                    value={project.irradiation.poaKwhM2Year}
                    min={0}
                    onChange={(v) => set("irradiation", { poaKwhM2Year: v })}
                  />
                  <NumberField
                    label="Rendement spécifique"
                    unit="kWh/kWc/an"
                    value={project.irradiation.specificYieldKwhKwp}
                    min={0}
                    onChange={(v) => set("irradiation", { specificYieldKwhKwp: v })}
                  />
                </div>

                <h3 className="mt-8 text-sm font-semibold">Pertes du système</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["temperaturePct", "Température"],
                      ["soilingPct", "Salissure"],
                      ["mismatchPct", "Désadaptation"],
                      ["dcWiringPct", "Câblage DC"],
                      ["acWiringPct", "Câblage AC"],
                      ["inverterPct", "Onduleur"],
                      ["availabilityPct", "Disponibilité"],
                      ["shadingPct", "Ombrage"],
                      ["otherPct", "Autres pertes"],
                    ] as const
                  ).map(([key, label]) => (
                    <NumberField
                      key={key}
                      label={label}
                      unit="%"
                      value={project.losses[key]}
                      min={0}
                      max={50}
                      onChange={(v) => set("losses", { [key]: v } as never)}
                    />
                  ))}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <Kpi label="Pertes totales" value={pct(study.energy.totalLossPct)} />
                  <Kpi label="Rendement spécifique" value={num(study.energy.specificYieldKwhKwp)} unit="kWh/kWc/an" />
                  <Kpi label="Production annuelle" value={num(study.energy.annualProductionKwh)} unit="kWh/an" />
                  <Kpi
                    label="Ratio de performance"
                    value={study.energy.performanceRatio ? num(study.energy.performanceRatio, 2) : "—"}
                    note={study.energy.performanceRatio ? undefined : "Nécessite H_POA"}
                  />
                </div>
              </Section>

              <Section title="Production mensuelle estimée" description="Répartition selon un profil générique — hypothèse de forme, non une donnée météorologique.">
                <MonthlyChart
                  data={study.energy.monthlyProductionKwh}
                  label="Production"
                  color="var(--chart-1)"
                />
              </Section>
            </>
          )}

          {step === 7 && (
            <>
              <Section title="8a. Stockage" description="Un dimensionnement fiable de batterie exige un profil de charge détaillé.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField
                    label="Stratégie de stockage"
                    value={project.battery.mode}
                    onChange={(v) => {
                      if (v === "recommandee") {
                        set("battery", {
                          mode: v,
                          nominalKwh: Math.round(study.battery.recommendedNominalKwh * 10) / 10,
                        });
                      } else {
                        set("battery", { mode: v });
                      }
                    }}
                    options={[
                      { value: "aucune", label: "Sans batterie" },
                      { value: "personnalisee", label: "Batterie définie par l'utilisateur" },
                      { value: "recommandee", label: "Capacité recommandée" },
                    ]}
                  />
                  <Kpi
                    label="Capacité recommandée"
                    value={num(study.battery.recommendedNominalKwh, 1)}
                    unit="kWh"
                    note="Hypothèse : 45 % de la consommation hors production"
                  />
                  <Kpi label="Autonomie indicative" value={num(study.battery.autonomyHours, 1)} unit="h" />
                </div>

                {project.battery.mode !== "aucune" && (
                  <>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {DEMO_BATTERIES.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() =>
                            set("battery", {
                              nominalKwh: b.nominalKwh,
                              dodPct: b.dodPct,
                              roundTripPct: b.roundTripPct,
                              maxChargeKw: b.maxChargeKw,
                              maxDischargeKw: b.maxDischargeKw,
                              cycleLife: b.cycleLife,
                            })
                          }
                          className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-secondary"
                        >
                          {b.model} · {b.nominalKwh} kWh
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <NumberField label="Capacité nominale" unit="kWh" value={project.battery.nominalKwh} min={0} onChange={(v) => set("battery", { nominalKwh: v })} />
                      <NumberField label="Profondeur de décharge (DoD)" unit="%" value={project.battery.dodPct} min={10} max={100} onChange={(v) => set("battery", { dodPct: v })} />
                      <NumberField label="Rendement aller-retour" unit="%" value={project.battery.roundTripPct} min={50} max={100} onChange={(v) => set("battery", { roundTripPct: v })} />
                      <NumberField label="Puissance de charge max" unit="kW" value={project.battery.maxChargeKw} min={0} onChange={(v) => set("battery", { maxChargeKw: v })} />
                      <NumberField label="Puissance de décharge max" unit="kW" value={project.battery.maxDischargeKw} min={0} onChange={(v) => set("battery", { maxDischargeKw: v })} />
                      <NumberField label="Durée de vie en cycles" unit="cycles" value={project.battery.cycleLife} min={0} step={100} onChange={(v) => set("battery", { cycleLife: v })} />
                    </div>
                  </>
                )}
              </Section>

              <Section title="8b. Analyse économique" description="Les résultats financiers sont des estimations et ne constituent pas une garantie de rentabilité.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField label="Modules PV" unit={currency} value={project.economics.costModules} min={0} onChange={(v) => set("economics", { costModules: v })} />
                  <NumberField label="Onduleur(s)" unit={currency} value={project.economics.costInverter} min={0} onChange={(v) => set("economics", { costInverter: v })} />
                  <NumberField label="Structure de montage" unit={currency} value={project.economics.costStructure} min={0} onChange={(v) => set("economics", { costStructure: v })} />
                  <NumberField label="Protections électriques" unit={currency} value={project.economics.costProtection} min={0} onChange={(v) => set("economics", { costProtection: v })} />
                  <NumberField label="Installation / pose" unit={currency} value={project.economics.costInstallation} min={0} onChange={(v) => set("economics", { costInstallation: v })} />
                  <NumberField label="Ingénierie / études" unit={currency} value={project.economics.costEngineering} min={0} onChange={(v) => set("economics", { costEngineering: v })} />
                  <NumberField label="Batterie" unit={currency} value={project.economics.costBattery} min={0} onChange={(v) => set("economics", { costBattery: v })} />
                  <NumberField label="Divers" unit={currency} value={project.economics.costOther} min={0} onChange={(v) => set("economics", { costOther: v })} />
                  <NumberField label="Maintenance annuelle (OPEX)" unit={`${currency}/an`} value={project.economics.opexAnnual} min={0} onChange={(v) => set("economics", { opexAnnual: v })} />
                  <NumberField label="Tarif d'injection du surplus" unit={`${currency}/kWh`} hint="0 si le surplus n'est pas valorisé." value={project.economics.exportTariff} min={0} onChange={(v) => set("economics", { exportTariff: v })} />
                  <NumberField label="Escalade tarifaire annuelle" unit="%/an" value={project.economics.tariffEscalationPct} min={0} max={20} onChange={(v) => set("economics", { tariffEscalationPct: v })} />
                  <NumberField label="Dégradation annuelle des modules" unit="%/an" value={project.economics.degradationPctYear} min={0} max={3} onChange={(v) => set("economics", { degradationPctYear: v })} />
                  <NumberField label="Durée de vie du projet" unit="ans" value={project.economics.lifetimeYears} min={1} max={40} step={1} onChange={(v) => set("economics", { lifetimeYears: Math.round(v) })} />
                  <NumberField label="Facteur d'émission du réseau" unit="kgCO₂/kWh" value={project.environment.emissionFactorKgPerKwh} min={0} max={2} onChange={(v) => set("environment", { emissionFactorKgPerKwh: v })} />
                  <TextField label="Source du facteur d'émission" value={project.environment.source} onChange={(v) => set("environment", { source: v })} />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <Kpi label="CAPEX total" value={money(study.finance.capex, currency)} />
                  <Kpi label="Économies année 1" value={money(study.finance.annualSavingsYear1, currency)} />
                  <Kpi
                    label="Temps de retour simple"
                    value={study.finance.simplePaybackYears ? num(study.finance.simplePaybackYears, 1) : "—"}
                    unit={study.finance.simplePaybackYears ? "ans" : undefined}
                  />
                  <Kpi label="CO₂ évité" value={num(study.environment.annualCo2AvoidedKg)} unit="kgCO₂/an" />
                </div>
              </Section>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              <ArrowLeft className="size-4" /> Étape précédente
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Étape suivante <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  update((p) => ({ ...p, status: "calcule" }));
                  navigate({ to: "/resultats" });
                }}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Générer les résultats <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="label-technical">Synthèse en direct</p>
            </div>
            <div className="px-4 py-3">
              <DataRow label="Puissance PV" value={`${num(study.sizing.dcPowerKwp, 2)} kWc`} />
              <DataRow label="Modules" value={`${num(study.sizing.moduleCount)} × ${study.module.pmaxW} Wc`} />
              <DataRow label="Onduleur" value={`${num(study.sizing.acPowerKw, 1)} kW AC`} />
              <DataRow label="Ratio DC/AC" value={num(study.sizing.dcAcRatio, 2)} />
              <DataRow label="Production" value={`${num(study.energy.annualProductionKwh)} kWh/an`} />
              <DataRow label="Rendement spécifique" value={`${num(study.energy.specificYieldKwhKwp)} kWh/kWc`} />
              <DataRow label="Autoconsommation" value={pct(study.self.selfConsumptionRatio * 100)} />
              <DataRow label="Autoproduction" value={pct(study.self.selfSufficiencyRatio * 100)} />
              <DataRow label="CAPEX" value={money(study.finance.capex, currency)} />
              <DataRow
                label="Retour simple"
                value={study.finance.simplePaybackYears ? `${num(study.finance.simplePaybackYears, 1)} ans` : "—"}
              />
            </div>
            <div className="border-t border-border px-4 py-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Estimations de pré-dimensionnement, à valider par un ingénieur qualifié.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-card px-4 py-3">
            <p className="label-technical">Contrôles</p>
            <ul className="mt-2 space-y-1.5 text-[12px]">
              {study.checks.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground">{c.label}</span>
                  <span
                    className={
                      c.status === "ok"
                        ? "text-success"
                        : c.status === "warning"
                          ? "text-warning-foreground"
                          : "text-destructive"
                    }
                  >
                    {c.status === "ok" ? "✓" : c.status === "warning" ? "⚠" : "✕"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MonthlyChart({
  data,
  label,
  color,
}: {
  data: number[];
  label: string;
  color: string;
}) {
  const chartData = data.map((v, i) => ({ mois: MONTHS_FR[i], [label]: Math.round(v) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={52} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 12,
            }}
            formatter={(v: number) => [`${num(v)} kWh`, label]}
          />
          <Bar dataKey={label} fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LayoutPreview({ maxModules, used }: { maxModules: number; used: number }) {
  const total = Math.max(maxModules, used, 1);
  const cols = Math.min(20, Math.ceil(Math.sqrt(total * 1.8)));
  const cells = Array.from({ length: Math.min(total, 200) });
  return (
    <div className="mt-3 rounded-sm border border-border bg-surface p-4">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells.map((_, i) => (
          <div
            key={i}
            className={`aspect-[1/1.7] rounded-[1px] ${
              i < used ? "bg-primary" : i < maxModules ? "bg-border" : "bg-destructive/40"
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[1px] bg-primary" /> Modules de la configuration ({num(used)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[1px] bg-border" /> Capacité géométrique restante
        </span>
        {used > maxModules && (
          <span className="flex items-center gap-1.5 text-destructive">
            <span className="size-2.5 rounded-[1px] bg-destructive/40" /> Dépassement de la surface exploitable
          </span>
        )}
      </div>
    </div>
  );
}
