import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoBadge, Section } from "@/components/pv/primitives";
import {
  DEMO_BATTERIES,
  DEMO_DATA_NOTICE,
  DEMO_INVERTERS,
  DEMO_MODULES,
  DEMO_STRUCTURES,
} from "@/lib/pv/equipment";
import { num } from "@/lib/pv/format";

export const Route = createFileRoute("/equipements")({
  head: () => ({
    meta: [
      { title: "Bibliothèque d'équipements — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Bibliothèque structurée de modules PV, onduleurs, batteries et structures de montage, avec leurs paramètres techniques.",
      },
      { property: "og:title", content: "Bibliothèque d'équipements — SOLARA ENGINEERING" },
      {
        property: "og:description",
        content: "Modules PV, onduleurs, batteries et structures : paramètres techniques structurés.",
      },
    ],
  }),
  component: Equipements,
});

const TABS = ["modules", "onduleurs", "batteries", "structures"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  modules: "Modules PV",
  onduleurs: "Onduleurs",
  batteries: "Batteries",
  structures: "Structures",
};

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="label-technical px-3 py-2 text-left whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-surface">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`px-3 py-2.5 whitespace-nowrap ${j === 0 ? "font-medium" : "numeric text-muted-foreground"}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Equipements() {
  const [tab, setTab] = useState<Tab>("modules");

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <header>
        <p className="label-technical">Base de données technique</p>
        <h1 className="mt-3 text-3xl font-bold">Bibliothèque d'équipements</h1>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{DEMO_DATA_NOTICE}</p>
        <div className="mt-4">
          <DemoBadge />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-1 rounded-sm border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-sm px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "modules" && (
          <Section
            title="Modules photovoltaïques"
            description="Caractéristiques aux conditions STC (1000 W/m², 25 °C, AM1.5)."
          >
            <Table
              head={[
                "Modèle",
                "Technologie",
                "Pmax [W]",
                "Voc [V]",
                "Vmp [V]",
                "Isc [A]",
                "Imp [A]",
                "β Voc [%/°C]",
                "β Pmax [%/°C]",
                "Dimensions [mm]",
                "Rendement [%]",
              ]}
              rows={DEMO_MODULES.map((m) => [
                `${m.manufacturer} ${m.model}`,
                m.technology,
                m.pmaxW,
                m.vocV,
                m.vmpV,
                m.iscA,
                m.impA,
                m.tempCoefVocPctC,
                m.tempCoefPmaxPctC,
                `${m.lengthMm} × ${m.widthMm}`,
                m.efficiencyPct,
              ])}
            />
          </Section>
        )}

        {tab === "onduleurs" && (
          <Section title="Onduleurs" description="Limites d'entrée utilisées par les vérifications électriques.">
            <Table
              head={[
                "Modèle",
                "P AC [kW]",
                "P DC max [kW]",
                "Plage MPPT [V]",
                "U DC max [V]",
                "I entrée max [A]",
                "MPPT",
                "Chaînes / MPPT",
                "Rendement [%]",
                "Réseau",
              ]}
              rows={DEMO_INVERTERS.map((i) => [
                `${i.manufacturer} ${i.model}`,
                i.acPowerKw,
                i.maxDcPowerKw,
                `${i.mpptVminV} – ${i.mpptVmaxV}`,
                i.maxDcVoltageV,
                i.maxInputCurrentA,
                i.mpptCount,
                i.maxStringsPerMppt,
                i.efficiencyPct,
                i.phases === 1 ? "Monophasé" : "Triphasé",
              ])}
            />
          </Section>
        )}

        {tab === "batteries" && (
          <Section title="Batteries" description="Capacités et limites de puissance déclarées.">
            <Table
              head={[
                "Modèle",
                "Capacité nominale [kWh]",
                "DoD [%]",
                "Rendement aller-retour [%]",
                "P charge max [kW]",
                "P décharge max [kW]",
                "Cycles",
              ]}
              rows={DEMO_BATTERIES.map((b) => [
                `${b.manufacturer} ${b.model}`,
                b.nominalKwh,
                b.dodPct,
                b.roundTripPct,
                b.maxChargeKw,
                b.maxDischargeKw,
                num(b.cycleLife),
              ])}
            />
          </Section>
        )}

        {tab === "structures" && (
          <Section title="Structures de montage" description="Référencement indicatif, sans note de calcul structurelle.">
            <Table
              head={["Modèle", "Type", "Matériau", "Inclinaison max [°]"]}
              rows={DEMO_STRUCTURES.map((s) => [
                `${s.manufacturer} ${s.model}`,
                s.type,
                s.material,
                s.maxTiltDeg,
              ])}
            />
          </Section>
        )}
      </div>
    </div>
  );
}
