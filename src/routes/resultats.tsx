import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Pencil } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CableTable, ProtectionTable } from "@/components/pv/ElectricalTables";
import { DesignReview } from "@/components/pv/DesignReview";
import { CheckList, DataRow, DemoBadge, Kpi, Section } from "@/components/pv/primitives";
import { runStudy } from "@/lib/pv/calc";
import { MONTHS_FR, money, num, pct } from "@/lib/pv/format";
import { useActiveProject } from "@/lib/pv/store";

export const Route = createFileRoute("/resultats")({
  head: () => ({
    meta: [
      { title: "Résultats de l'étude — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Tableau de bord d'ingénierie : puissance PV, production estimée, autoconsommation, configuration des chaînes, analyse économique et vérifications.",
      },
      { property: "og:title", content: "Résultats du pré-dimensionnement photovoltaïque" },
      {
        property: "og:description",
        content: "Indicateurs clés, graphiques mensuels, bilan énergétique et analyse économique préliminaire.",
      },
    ],
  }),
  component: Resultats,
});

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  fontSize: 12,
};

function Resultats() {
  const { project, ready } = useActiveProject();
  const study = useMemo(() => (project ? runStudy(project) : null), [project]);

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!project || !study) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Aucune étude à afficher</h1>
        <Link
          to="/etude"
          className="mt-6 inline-flex rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          Démarrer une étude
        </Link>
      </div>
    );
  }

  const cur = project.info.currency;
  const monthly = MONTHS_FR.map((m, i) => ({
    mois: m,
    Production: Math.round(study.energy.monthlyProductionKwh[i] ?? 0),
    Consommation: Math.round(study.consumption.monthlyKwh[i] ?? 0),
    Autoconsommation: Math.round(study.self.monthlySelfConsumedKwh[i] ?? 0),
    Soutirage: Math.round(study.self.monthlyImportKwh[i] ?? 0),
    Injection: Math.round(study.self.monthlyExportKwh[i] ?? 0),
  }));

  const capexParts = [
    ["Modules", project.economics.costModules],
    ["Onduleur", project.economics.costInverter],
    ["Structure", project.economics.costStructure],
    ["Protections", project.economics.costProtection],
    ["Installation", project.economics.costInstallation],
    ["Ingénierie", project.economics.costEngineering],
    ["Batterie", project.battery.mode === "aucune" ? 0 : project.economics.costBattery],
    ["Divers", project.economics.costOther],
  ]
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({ name: name as string, value: value as number }));

  const pieColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--muted-foreground)",
    "var(--primary)",
    "var(--accent)",
  ];

  const errors = study.checks.filter((c) => c.status === "error").length;
  const warnings = study.checks.filter((c) => c.status === "warning").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Tableau de bord d'ingénierie</p>
          <h1 className="mt-2 text-3xl font-bold">{project.info.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[project.info.city, project.info.country].filter(Boolean).join(", ")} ·{" "}
            {project.info.latitude}°, {project.info.longitude}° ·{" "}
            {project.info.gridConnection === "raccorde"
              ? "Raccordé au réseau"
              : project.info.gridConnection === "hybride"
                ? "Hybride"
                : "Hors réseau"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.isDemo && <DemoBadge>DÉMO — USAGE NON PROFESSIONNEL</DemoBadge>}
          <Link
            to="/etude"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary"
          >
            <Pencil className="size-3.5" /> Modifier les hypothèses
          </Link>
          <Link
            to="/rapport"
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground"
          >
            <FileText className="size-3.5" /> Générer le rapport
          </Link>
        </div>
      </header>

      {(errors > 0 || warnings > 0) && (
        <div
          className={`rounded-sm border px-4 py-3 text-[13px] ${
            errors > 0
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-warning/40 bg-warning/10 text-warning-foreground"
          }`}
        >
          {errors > 0
            ? `${errors} non-conformité(s) électrique(s) détectée(s) — voir la section « Vérifications d'ingénierie ».`
            : `${warnings} point(s) d'attention — voir la section « Vérifications d'ingénierie ».`}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi label="Puissance PV" value={num(study.sizing.dcPowerKwp, 2)} unit="kWc" />
        <Kpi label="Nombre de modules" value={num(study.sizing.moduleCount)} unit="unités" />
        <Kpi label="Puissance onduleur" value={num(study.sizing.acPowerKw, 1)} unit="kW AC" />
        <Kpi label="Production annuelle" value={num(study.energy.annualProductionKwh)} unit="kWh/an" />
        <Kpi label="Autoconsommation" value={pct(study.self.selfConsumptionRatio * 100)} />
        <Kpi
          label="Temps de retour"
          value={study.finance.simplePaybackYears ? num(study.finance.simplePaybackYears, 1) : "—"}
          {...(study.finance.simplePaybackYears ? { unit: "ans" } : {})}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Production et consommation mensuelles" description="Bilan mensuel estimé, en kWh.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={52} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Production" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Consommation" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Flux énergétiques" description="Autoconsommation, soutirage réseau et injection du surplus.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={52} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Autoconsommation" stackId="1" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.55} />
                <Area type="monotone" dataKey="Soutirage" stackId="1" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.35} />
                <Area type="monotone" dataKey="Injection" stackId="2" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Kpi label="Autoconsommée" value={num(study.self.selfConsumedKwh)} unit="kWh/an" />
            <Kpi label="Soutirage réseau" value={num(study.self.importKwh)} unit="kWh/an" />
            <Kpi label="Injection réseau" value={num(study.self.exportKwh)} unit="kWh/an" />
            <Kpi label="Taux d'autoproduction" value={pct(study.self.selfSufficiencyRatio * 100)} />
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Architecture du système">
          <DataRow label="Modules par chaîne" value={num(study.sizing.modulesPerString)} />
          <DataRow label="Nombre de chaînes" value={num(study.sizing.stringCount)} />
          <DataRow label="Onduleurs" value={num(project.selection.inverterQuantity)} />
          <DataRow label="Chaînes par MPPT" value={num(study.strings.stringsPerMppt, 2)} />
          <DataRow label="U_oc à T min" value={`${num(study.strings.vocMaxV)} V`} />
          <DataRow label="U_mp à T max" value={`${num(study.strings.vmpMinV)} V`} />
          <DataRow label="Courant par MPPT" value={`${num(study.strings.currentPerMpptA, 1)} A`} />
          <DataRow label="Ratio DC/AC" value={num(study.sizing.dcAcRatio, 2)} />
        </Section>

        <Section title="Équipements retenus" aside={<DemoBadge />}>
          <p className="label-technical">Module</p>
          <DataRow label="Référence" value={`${study.module.manufacturer} ${study.module.model}`} />
          <DataRow label="Technologie" value={study.module.technology} />
          <DataRow label="Puissance" value={`${study.module.pmaxW} Wc`} />
          <DataRow label="Rendement" value={`${study.module.efficiencyPct} %`} />
          <p className="label-technical mt-5">Onduleur</p>
          <DataRow label="Référence" value={`${study.inverter.manufacturer} ${study.inverter.model}`} />
          <DataRow label="Puissance AC" value={`${study.inverter.acPowerKw} kW`} />
          <DataRow label="Plage MPPT" value={`${study.inverter.mpptVminV} – ${study.inverter.mpptVmaxV} V`} />
          <DataRow label="Réseau" value={study.inverter.phases === 1 ? "Monophasé" : "Triphasé"} />
          {project.battery.mode !== "aucune" && (
            <>
              <p className="label-technical mt-5">Stockage</p>
              <DataRow label="Capacité nominale" value={`${num(project.battery.nominalKwh, 1)} kWh`} />
              <DataRow label="Capacité utile" value={`${num(study.battery.usableKwh, 1)} kWh`} />
              <DataRow label="Autonomie indicative" value={`${num(study.battery.autonomyHours, 1)} h`} />
              <DataRow label="Cycles annuels estimés" value={num(study.battery.cyclesPerYear)} />
            </>
          )}
        </Section>

        <Section title="Hypothèses de production">
          <DataRow label="Méthode" value={project.irradiation.method === "poa" ? "H_POA + pertes" : "Rendement spécifique saisi"} />
          <DataRow label="H_POA" value={`${num(project.irradiation.poaKwhM2Year)} kWh/m²/an`} />
          <DataRow label="Rendement spécifique" value={`${num(study.energy.specificYieldKwhKwp)} kWh/kWc/an`} />
          <DataRow label="Pertes totales" value={pct(study.energy.totalLossPct)} />
          <DataRow
            label="Ratio de performance"
            value={study.energy.performanceRatio ? num(study.energy.performanceRatio, 2) : "—"}
          />
          <DataRow label="Inclinaison / azimut" value={`${project.area.tiltDeg}° / ${project.area.azimuthDeg}°`} />
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Source d'irradiation : {project.irradiation.source || "non renseignée"}.
          </p>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Analyse économique" description="Estimations non contractuelles, sans actualisation.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Kpi label="CAPEX total" value={money(study.finance.capex, cur)} />
            <Kpi label="Économies année 1" value={money(study.finance.annualSavingsYear1, cur)} />
            <Kpi label="OPEX annuel" value={money(study.finance.opexAnnual, cur)} />
            <Kpi label="ROI sur la durée de vie" value={pct(study.finance.roiPct)} />
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={study.finance.cashflow}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={70} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => money(v, cur)}
                  labelFormatter={(l) => `Année ${l}`}
                />
                <Line type="monotone" dataKey="cumulative" name="Flux cumulé" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Répartition du CAPEX">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={capexParts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {capexParts.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v, cur)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <DataRow label="CO₂ évité (annuel)" value={`${num(study.environment.annualCo2AvoidedKg)} kgCO₂/an`} />
            <DataRow
              label={`CO₂ évité (${project.economics.lifetimeYears} ans)`}
              value={`${num(study.environment.lifetimeCo2AvoidedT, 1)} tCO₂`}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">
              Facteur d'émission : {num(project.environment.emissionFactorKgPerKwh, 3)} kgCO₂/kWh —{" "}
              {project.environment.source || "source non renseignée"}.
            </p>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Calepinage" aside={<Link to="/calepinage" className="text-xs underline">Voir le plan</Link>}>
          <DataRow label="Surface de la zone" value={`${num(study.layout.areaM2)} m²`} />
          <DataRow label="Modules placés" value={num(study.layout.moduleCount)} />
          <DataRow label="Puissance géométrique" value={`${num(study.layout.dcPowerKwp, 2)} kWc`} />
          <DataRow label="Rangées × colonnes" value={`${study.layout.rows} × ${study.layout.columns}`} />
          <DataRow label="Pas entre rangées" value={`${num(study.layout.rowPitchM, 2)} m`} />
          <DataRow label="Surface occupée" value={`${num(study.layout.occupiedAreaM2)} m²`} />
          <DataRow label="Hauteur solaire hiver" value={`${num(study.layout.winterSolarElevationDeg, 1)}°`} />
        </Section>
        <div className="lg:col-span-2"><Section title="Protections" aside={<Link to="/unifilaire" className="text-xs underline">Schéma unifilaire</Link>}>
          <ProtectionTable items={study.protections} />
        </Section></div>
      </div>

      <Section title="Câbles — dimensionnement préliminaire">
        <CableTable cables={study.cables} />
      </Section>

      <Section title="Revue IA de la conception" description="Corrections recommandées par un modèle d'IA à partir du site, du calepinage et des choix électriques.">
        <DesignReview project={project} study={study} />
      </Section>

      <Section
        title="Vérifications d'ingénierie"
        description="Chaque écart est justifié techniquement. Les erreurs doivent être corrigées avant toute suite donnée à l'étude."
      >
        <CheckList checks={study.checks} />
      </Section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Résultats de pré-dimensionnement. Le modèle est mensuel et simplifié : il ne
        remplace ni une simulation au pas horaire, ni une note de calcul électrique, ni une
        vérification structurelle.
      </p>
    </div>
  );
}
