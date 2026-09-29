import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo } from "react";
import { runStudy } from "@/lib/pv/calc";
import { BRAND, DISCLAIMER } from "@/lib/brand";
import { MONTHS_FR, money, num, pct } from "@/lib/pv/format";
import { useActiveProject } from "@/lib/pv/store";
import { LayoutDrawing } from "@/components/pv/LayoutDrawing";
import { SingleLineDiagram } from "@/components/pv/SingleLineDiagram";
import { CableTable, ProtectionTable } from "@/components/pv/ElectricalTables";
import { ReviewText } from "@/components/pv/DesignReview";
import { loadReview } from "@/lib/pv/review";
import { useEffect, useState } from "react";
import { LAYOUT_DISCLAIMER } from "@/lib/pv/layout";

export const Route = createFileRoute("/rapport")({
  head: () => ({
    meta: [
      { title: "Rapport de conception préliminaire — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Rapport d'étude préliminaire photovoltaïque : hypothèses, dimensionnement, production, économie, environnement et vérifications d'ingénierie.",
      },
      { property: "og:title", content: "Rapport de conception préliminaire PV" },
      {
        property: "og:description",
        content: "Document structuré et imprimable pour une étude de pré-dimensionnement photovoltaïque.",
      },
    ],
  }),
  component: Rapport,
});

function Block({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-border pt-6">
      <h2 className="font-display text-base font-semibold">
        <span className="numeric mr-2 text-accent">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table className="mt-2 w-full border-collapse text-[13px]">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-border/60">
            <td className="py-1.5 pr-4 text-muted-foreground">{k}</td>
            <td className="numeric py-1.5 text-right font-medium text-foreground">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Rapport() {
  const { project, ready } = useActiveProject();
  const study = useMemo(() => (project ? runStudy(project) : null), [project]);

  if (!ready) return <div className="px-5 py-20 text-sm text-muted-foreground">Chargement…</div>;

  if (!project || !study) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Aucune étude disponible</h1>
        <Link to="/etude" className="mt-6 inline-flex rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
          Démarrer une étude
        </Link>
      </div>
    );
  }

  const cur = project.info.currency;
  const p = project;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/resultats" className="text-[13px] text-muted-foreground underline">
          ← Retour au tableau de bord
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          <Printer className="size-4" /> Imprimer / exporter en PDF
        </button>
      </div>

      <article className="space-y-6 rounded-md border border-border bg-card p-8">
        {/* Cover */}
        <header className="border-b border-border pb-8">
          <p className="label-technical">{BRAND.fullName}</p>
          <h1 className="mt-6 text-3xl font-bold">CONCEPTION PHOTOVOLTAÏQUE PRÉLIMINAIRE</h1>
          <p className="mt-2 text-lg text-muted-foreground">{p.info.name}</p>
          {p.isDemo && (
            <p className="mt-4 inline-block border border-warning/50 bg-warning/10 px-3 py-1 font-mono text-[11px] tracking-wider text-warning-foreground">
              DÉMO — USAGE NON PROFESSIONNEL
            </p>
          )}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Table
              rows={[
                ["Localisation", [p.info.city, p.info.country].filter(Boolean).join(", ") || "—"],
                ["Coordonnées", `${p.info.latitude}°, ${p.info.longitude}°`],
                ["Type de projet", p.info.type],
              ]}
            />
            <Table
              rows={[
                ["Raccordement", p.info.gridConnection],
                ["Date d'édition", new Date().toLocaleDateString("fr-FR")],
                ["Devise", cur],
              ]}
            />
          </div>
        </header>

        <Block n={1} title="Informations du projet">
          <Table
            rows={[
              ["Nom du projet", p.info.name],
              ["Adresse", p.info.address || "—"],
              ["Tarif électrique", `${num(p.info.tariff, 2)} ${cur}/kWh`],
              ["Tarif d'injection", `${num(p.economics.exportTariff, 2)} ${cur}/kWh`],
            ]}
          />
        </Block>

        <Block n="1.1" title="Localisation du site et emprise">
          <Table
            rows={[
              ["Site", p.site.label || "—"],
              ["Coordonnées", `${p.info.latitude.toFixed(5)}° / ${p.info.longitude.toFixed(5)}°`],
              ["Altitude approximative", p.site.altitudeM !== null ? `${Math.round(p.site.altitudeM)} m` : "Non disponible"],
              ["Emprise", p.site.polygon.length >= 3 ? `Polygone dessiné sur carte — ${num(study.layout.areaM2, 1)} m²` : `Rectangle ${p.area.roofLengthM} × ${p.area.roofWidthM} m`],
              ["Dimensions approx.", `${num(study.layout.lengthM, 1)} × ${num(study.layout.widthM, 1)} m`],
            ]}
          />
          <p className="mt-2 text-xs text-muted-foreground">Capture satellite : non intégrée au document (imagerie consultable dans la page Calepinage).</p>
        </Block>

        <Block n={2} title="Hypothèses de conception">
          <Table
            rows={[
              ["Méthode d'irradiation", p.irradiation.method === "poa" ? "H_POA dans le plan des modules" : "Rendement spécifique saisi"],
              ["H_POA", `${num(p.irradiation.poaKwhM2Year)} kWh/m²/an`],
              ["Source d'irradiation", p.irradiation.source || "non renseignée"],
              ["Inclinaison / azimut", `${p.area.tiltDeg}° / ${p.area.azimuthDeg}°`],
              ["Température ambiante minimale", `${p.selection.minAmbientTempC} °C`],
              ["Température cellule maximale", `${p.selection.maxCellTempC} °C`],
              ["Répartition mensuelle", "Profil générique (hypothèse de forme, non mesurée)"],
            ]}
          />
        </Block>

        <Block n={3} title="Analyse de la consommation">
          <Table
            rows={[
              ["Méthode de saisie", p.consumption.mode === "annuelle" ? "Annuelle" : "Mensuelle"],
              ["Qualité de la donnée", p.consumption.quality === "mesuree" ? "Mesurée" : "Estimée"],
              ["Consommation annuelle", `${num(study.consumption.annualKwh)} kWh/an`],
              ["Moyenne mensuelle", `${num(study.consumption.averageMonthlyKwh)} kWh`],
              ["Moyenne journalière", `${num(study.consumption.averageDailyKwh, 1)} kWh`],
            ]}
          />
        </Block>

        <Block n={4} title="Dimensionnement du générateur PV">
          <Table
            rows={[
              ["Puissance crête installée", `${num(study.sizing.dcPowerKwp, 2)} kWc`],
              ["Nombre de modules", `${num(study.sizing.moduleCount)} unités`],
              ["Surface exploitable", `${num(study.geometry.usableAreaM2, 1)} m²`],
              ["Capacité géométrique", `${num(study.geometry.maxModulesByArea)} modules`],
              ["Surface occupée", `${num(study.sizing.occupiedAreaM2, 1)} m²`],
              ["Surface restante", `${num(study.sizing.remainingAreaM2, 1)} m²`],
            ]}
          />
        </Block>

        <Block n={5} title="Sélection du module">
          <Table
            rows={[
              ["Référence", `${study.module.manufacturer} ${study.module.model}`],
              ["Technologie", study.module.technology],
              ["Puissance Pmax", `${study.module.pmaxW} Wc`],
              ["Voc / Vmp", `${study.module.vocV} V / ${study.module.vmpV} V`],
              ["Isc / Imp", `${study.module.iscA} A / ${study.module.impA} A`],
              ["Coefficients β Voc / β Pmax", `${study.module.tempCoefVocPctC} / ${study.module.tempCoefPmaxPctC} %/°C`],
              ["Dimensions", `${study.module.lengthMm} × ${study.module.widthMm} mm`],
              ["Conditions", study.module.stc],
            ]}
          />
          {study.module.demo && (
            <p className="mt-2 text-[12px] text-warning-foreground">
              Caractéristiques de démonstration — à remplacer par une fiche technique constructeur.
            </p>
          )}
        </Block>

        <Block n={6} title="Sélection de l'onduleur">
          <Table
            rows={[
              ["Référence", `${study.inverter.manufacturer} ${study.inverter.model}`],
              ["Quantité", `${p.selection.inverterQuantity}`],
              ["Puissance AC totale", `${num(study.sizing.acPowerKw, 1)} kW`],
              ["Plage MPPT", `${study.inverter.mpptVminV} – ${study.inverter.mpptVmaxV} V`],
              ["Tension DC maximale", `${study.inverter.maxDcVoltageV} V`],
              ["Courant d'entrée maximal", `${study.inverter.maxInputCurrentA} A`],
              ["Ratio DC/AC", num(study.sizing.dcAcRatio, 2)],
            ]}
          />
        </Block>

        <Block n={7} title="Configuration des chaînes">
          <Table
            rows={[
              ["Modules par chaîne", num(study.sizing.modulesPerString)],
              ["Nombre de chaînes", num(study.sizing.stringCount)],
              ["Chaînes par MPPT", num(study.strings.stringsPerMppt, 2)],
              [`U_oc à ${p.selection.minAmbientTempC} °C`, `${num(study.strings.vocMaxV)} V`],
              [`U_mp à ${p.selection.maxCellTempC} °C`, `${num(study.strings.vmpMinV)} V`],
              ["Courant par MPPT", `${num(study.strings.currentPerMpptA, 1)} A`],
            ]}
          />
        </Block>

        <Block n="7.1" title="Calepinage automatique préliminaire">
          <LayoutDrawing layout={study.layout} modulesPerString={p.selection.modulesPerString} stringCount={p.selection.stringCount} tiltDeg={p.area.tiltDeg} azimuthDeg={p.area.azimuthDeg} height={380} />
          <p className="mt-2 text-xs text-muted-foreground">{LAYOUT_DISCLAIMER}</p>
        </Block>

        <Block n="7.2" title="Schéma unifilaire préliminaire">
          <div className="border border-border"><SingleLineDiagram project={p} study={study} /></div>
        </Block>

        <Block n="7.3" title="Protections — sélection préliminaire">
          <ProtectionTable items={study.protections} />
        </Block>

        <Block n="7.4" title="Dimensionnement préliminaire des câbles">
          <CableTable cables={study.cables} />
        </Block>

        <Block n="7.5" title="Revue IA de la conception">
          <AiReview id={p.id} />
        </Block>

        <Block n={8} title="Production énergétique estimée">
          <Table
            rows={[
              ["Production annuelle", `${num(study.energy.annualProductionKwh)} kWh/an`],
              ["Rendement spécifique", `${num(study.energy.specificYieldKwhKwp)} kWh/kWc/an`],
              ["Ratio de performance", study.energy.performanceRatio ? num(study.energy.performanceRatio, 2) : "—"],
            ]}
          />
          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="label-technical py-1.5 text-left">Mois</th>
                {MONTHS_FR.map((m) => (
                  <th key={m} className="label-technical py-1.5 text-right">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-1.5 text-muted-foreground">Production [kWh]</td>
                {study.energy.monthlyProductionKwh.map((v, i) => (
                  <td key={i} className="numeric py-1.5 text-right">{num(v)}</td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Consommation [kWh]</td>
                {study.consumption.monthlyKwh.map((v, i) => (
                  <td key={i} className="numeric py-1.5 text-right">{num(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </Block>

        <Block n={9} title="Hypothèses de pertes">
          <Table
            rows={[
              ["Température", pct(p.losses.temperaturePct)],
              ["Salissure", pct(p.losses.soilingPct)],
              ["Désadaptation", pct(p.losses.mismatchPct)],
              ["Câblage DC", pct(p.losses.dcWiringPct)],
              ["Câblage AC", pct(p.losses.acWiringPct)],
              ["Onduleur", pct(p.losses.inverterPct)],
              ["Disponibilité", pct(p.losses.availabilityPct)],
              ["Ombrage", pct(p.losses.shadingPct)],
              ["Autres", pct(p.losses.otherPct)],
              ["Pertes totales", pct(study.energy.totalLossPct)],
            ]}
          />
        </Block>

        <Block n={10} title="Autoconsommation et échanges réseau">
          <Table
            rows={[
              ["Énergie autoconsommée", `${num(study.self.selfConsumedKwh)} kWh/an`],
              ["Soutirage réseau", `${num(study.self.importKwh)} kWh/an`],
              ["Injection réseau", `${num(study.self.exportKwh)} kWh/an`],
              ["Taux d'autoconsommation", pct(study.self.selfConsumptionRatio * 100)],
              ["Taux d'autoproduction", pct(study.self.selfSufficiencyRatio * 100)],
            ]}
          />
          <p className="mt-2 text-[12px]">
            Calcul mensuel simplifié. Une simulation au pas horaire donnerait généralement un
            taux d'autoconsommation inférieur.
          </p>
        </Block>

        {p.battery.mode !== "aucune" && (
          <Block n={11} title="Stockage">
            <Table
              rows={[
                ["Capacité nominale", `${num(p.battery.nominalKwh, 1)} kWh`],
                ["Profondeur de décharge", pct(p.battery.dodPct, 0)],
                ["Capacité utile", `${num(study.battery.usableKwh, 1)} kWh`],
                ["Rendement aller-retour", pct(p.battery.roundTripPct, 0)],
                ["Autonomie indicative", `${num(study.battery.autonomyHours, 1)} h`],
                ["Cycles annuels estimés", num(study.battery.cyclesPerYear)],
              ]}
            />
            <p className="mt-2 text-[12px]">
              Le dimensionnement définitif d'un stockage nécessite un profil de charge détaillé.
            </p>
          </Block>
        )}

        <Block n={p.battery.mode !== "aucune" ? 12 : 11} title="Analyse économique">
          <Table
            rows={[
              ["CAPEX total", money(study.finance.capex, cur)],
              ["OPEX annuel", money(study.finance.opexAnnual, cur)],
              ["Économies année 1", money(study.finance.annualSavingsYear1, cur)],
              ["Temps de retour simple", study.finance.simplePaybackYears ? `${num(study.finance.simplePaybackYears, 1)} ans` : "non atteint sur la durée étudiée"],
              [`Économies cumulées (${p.economics.lifetimeYears} ans)`, money(study.finance.lifetimeSavings, cur)],
              ["ROI", pct(study.finance.roiPct)],
              ["Escalade tarifaire", `${num(p.economics.tariffEscalationPct, 1)} %/an`],
              ["Dégradation des modules", `${num(p.economics.degradationPctYear, 2)} %/an`],
            ]}
          />
          <p className="mt-2 text-[12px]">
            Ces valeurs sont des estimations sans actualisation et ne constituent pas une
            garantie de rentabilité.
          </p>
        </Block>

        <Block n={p.battery.mode !== "aucune" ? 13 : 12} title="Analyse environnementale">
          <Table
            rows={[
              ["Facteur d'émission", `${num(p.environment.emissionFactorKgPerKwh, 3)} kgCO₂/kWh`],
              ["Source", p.environment.source || "non renseignée"],
              ["CO₂ évité annuel", `${num(study.environment.annualCo2AvoidedKg)} kgCO₂/an`],
              [`CO₂ évité sur ${p.economics.lifetimeYears} ans`, `${num(study.environment.lifetimeCo2AvoidedT, 1)} tCO₂`],
            ]}
          />
        </Block>

        <Block n={p.battery.mode !== "aucune" ? 14 : 13} title="Vérifications d'ingénierie">
          <ul className="space-y-2">
            {study.checks.map((c) => (
              <li key={c.id} className="border-b border-border/60 pb-2">
                <p className="text-[13px] font-medium text-foreground">
                  {c.status === "ok" ? "✓" : c.status === "warning" ? "⚠" : "✕"} {c.label}
                  {c.value ? ` — ${c.value}` : ""}
                  {c.limit ? ` (limite ${c.limit})` : ""}
                </p>
                <p className="text-[12px]">{c.detail}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block n={p.battery.mode !== "aucune" ? 15 : 14} title="Hypothèses importantes et limites">
          <ul className="list-disc space-y-1.5 pl-5 text-[13px]">
            <li>Modèle énergétique mensuel simplifié, sans simulation au pas horaire.</li>
            <li>Répartition mensuelle issue d'un profil générique et non de données météorologiques mesurées.</li>
            <li>Autoconsommation estimée à partir d'un facteur de simultanéité, sans profil de charge réel.</li>
            <li>Caractéristiques d'équipement de démonstration lorsque signalées comme telles.</li>
            <li>Aucune vérification structurelle, de protection électrique, de chute de tension ni de conformité au raccordement.</li>
            <li>Analyse financière sans actualisation ni prise en compte de la fiscalité ou des subventions.</li>
          </ul>
          <p className="mt-4 border-l-2 border-accent pl-4 text-[13px] font-medium text-foreground">
            {DISCLAIMER}
          </p>
        </Block>

        <footer className="border-t border-border pt-4 text-[11px] text-muted-foreground">
          {BRAND.fullName} — Rapport de conception préliminaire · Document non contractuel ·
          Édité le {new Date().toLocaleDateString("fr-FR")}
        </footer>
      </article>
    </div>
  );
}

function AiReview({ id }: { id: string }) {
  const [r, setR] = useState<ReturnType<typeof loadReview>>(null);
  useEffect(() => setR(loadReview(id)), [id]);
  if (!r) return <p className="text-[12px] text-muted-foreground">Aucune revue IA réalisée pour ce projet (lancer la revue depuis la page Résultats ou l'étape « Conception & revue »).</p>;
  return (
    <div>
      <p className="mb-2 text-[11px] text-muted-foreground">Revue générée le {new Date(r.at).toLocaleString("fr-FR")} — indicative, à valider par un professionnel qualifié.</p>
      <ReviewText text={r.text} />
    </div>
  );
}
