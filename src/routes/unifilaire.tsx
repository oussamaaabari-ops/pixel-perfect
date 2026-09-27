import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { NumberField, SelectField } from "@/components/pv/fields";
import { ProtectionTable, CableTable } from "@/components/pv/ElectricalTables";
import { Section } from "@/components/pv/primitives";
import { SingleLineDiagram } from "@/components/pv/SingleLineDiagram";
import { runStudy } from "@/lib/pv/calc";
import { useActiveProject } from "@/lib/pv/store";
import type { CableInput } from "@/lib/pv/types";

export const Route = createFileRoute("/unifilaire")({
  head: () => ({
    meta: [
      { title: "Schéma unifilaire, protections et câbles — SOLARA ENGINEERING" },
      { name: "description", content: "Schéma unifilaire préliminaire généré automatiquement, sélection préliminaire des protections DC/AC et dimensionnement des câbles." },
      { property: "og:title", content: "Schéma unifilaire PV automatique" },
      { property: "og:description", content: "Chaînes, coffret DC, onduleur, protections AC, TGBT et réseau à partir des valeurs calculées du projet." },
    ],
  }),
  component: Unifilaire,
});

function Unifilaire() {
  const { project, update, ready } = useActiveProject();
  const study = useMemo(() => (project ? runStudy(project) : null), [project]);
  if (!ready) return <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-muted-foreground">Chargement…</div>;
  if (!project || !study)
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Aucun projet actif</h1>
        <Link to="/etude" className="mt-6 inline-flex rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Ouvrir l'assistant</Link>
      </div>
    );
  const c = project.cables;
  const setC = (v: Partial<CableInput>) => update((p) => ({ ...p, cables: { ...p.cables, ...v } }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Conception électrique · {project.info.name}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Schéma unifilaire préliminaire</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Généré à partir du module, des chaînes, de l'onduleur, du raccordement et de la batterie du projet. Il se met à jour à chaque modification.
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="no-print rounded-sm border border-border px-3 py-1.5 text-xs font-semibold">
          Imprimer / PDF
        </button>
      </header>

      <div className="overflow-x-auto rounded-md border border-border">
        <SingleLineDiagram project={project} study={study} />
      </div>

      <Section title="Protections — SÉLECTION PRÉLIMINAIRE" description="Règles simplifiées (esprit IEC 62548 / IEC 60364). Ne remplace pas une étude de coordination détaillée.">
        <ProtectionTable items={study.protections} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Section title="Hypothèses de câblage">
          <div className="space-y-4">
            <NumberField label="Longueur DC (aller)" unit="m" value={c.dcLengthM} min={0} onChange={(v) => setC({ dcLengthM: v })} />
            <NumberField label="Longueur AC" unit="m" value={c.acLengthM} min={0} onChange={(v) => setC({ acLengthM: v })} />
            <SelectField label="Matériau" value={c.material} onChange={(v) => setC({ material: v })}
              options={[{ value: "cuivre", label: "Cuivre" }, { value: "aluminium", label: "Aluminium" }]} />
            <SelectField label="Mode de pose" value={c.method} onChange={(v) => setC({ method: v })}
              options={[{ value: "B1", label: "B1 — conduit sur paroi" }, { value: "C", label: "C — fixé sur paroi / chemin plein" }, { value: "E", label: "E — chemin de câbles perforé" }]} />
            <NumberField label="Température ambiante" unit="°C" value={c.ambientC} onChange={(v) => setC({ ambientC: v })} />
            <NumberField label="Circuits groupés" unit="—" value={c.groupedCircuits} min={1} step={1} onChange={(v) => setC({ groupedCircuits: Math.max(1, Math.round(v)) })} />
            <NumberField label="Chute de tension max. DC" unit="%" value={c.maxDropDcPct} min={0} onChange={(v) => setC({ maxDropDcPct: v })} />
            <NumberField label="Chute de tension max. AC" unit="%" value={c.maxDropAcPct} min={0} onChange={(v) => setC({ maxDropAcPct: v })} />
          </div>
        </Section>
        <Section title="Dimensionnement préliminaire des câbles" description="Courant admissible Iz = I0 × k_T × k_G × k_matériau ; ΔU = k × L × I × ρ / S.">
          <CableTable cables={study.cables} />
        </Section>
      </div>
    </div>
  );
}
