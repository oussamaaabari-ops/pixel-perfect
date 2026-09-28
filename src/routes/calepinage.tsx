import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { NumberField, SelectField } from "@/components/pv/fields";
import { LayoutDrawing } from "@/components/pv/LayoutDrawing";
import { Kpi, Section } from "@/components/pv/primitives";
import { SitePanel } from "@/components/pv/SitePanel";
import { runStudy } from "@/lib/pv/calc";
import { LAYOUT_DISCLAIMER } from "@/lib/pv/layout";
import { useActiveProject } from "@/lib/pv/store";
import type { LayoutInput } from "@/lib/pv/types";

export const Route = createFileRoute("/calepinage")({
  head: () => ({
    meta: [
      { title: "Calepinage PV automatique — SOLARA ENGINEERING" },
      { name: "description", content: "Site sur carte satellite, emprise dessinée et calepinage automatique préliminaire des modules photovoltaïques." },
      { property: "og:title", content: "Calepinage PV automatique" },
      { property: "og:description", content: "Implantation préliminaire des modules : rangées, colonnes, puissance DC, surface occupée." },
    ],
  }),
  component: Calepinage,
});

function Calepinage() {
  const { project, update, ready } = useActiveProject();
  const study = useMemo(() => (project ? runStudy(project) : null), [project]);
  if (!ready) return <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-muted-foreground">Chargement…</div>;
  if (!project || !study) return <NoProject />;
  const L = study.layout;
  const setL = (v: Partial<LayoutInput>) => update((p) => ({ ...p, layout: { ...p.layout, ...v } }));
  const matchLayout = () =>
    update((p) => {
      const nps = Math.max(1, p.selection.modulesPerString);
      return { ...p, selection: { ...p.selection, stringCount: Math.max(1, Math.floor(L.moduleCount / nps)) } };
    });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10">
      <header>
        <p className="label-technical">Plan d'implantation · {project.info.name}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Calepinage PV automatique</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Site → emprise → modules → rangées / colonnes → groupes de chaînes. Toute modification met à jour le schéma unifilaire, la production, l'économie et le rapport.
        </p>
      </header>

      <Section title="Site et emprise d'implantation" description="Recherchez l'adresse, placez le repère puis dessinez la toiture ou la zone au sol (polygone ou rectangle).">
        <SitePanel project={project} update={update} layout={L} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Section title="Paramètres du calepinage">
          <div className="space-y-4">
            <SelectField label="Orientation des modules" value={project.layout.orientation} onChange={(v) => setL({ orientation: v })}
              options={[{ value: "portrait", label: "Portrait" }, { value: "paysage", label: "Paysage" }]} />
            <SelectField label="Mode de calepinage" value={project.layout.mode} onChange={(v) => setL({ mode: v })}
              options={[
                { value: "max-modules", label: "Nombre maximal de modules" },
                { value: "max-puissance", label: "Puissance maximale (meilleure orientation)" },
                { value: "espacement-optimise", label: "Espacement optimisé (sans ombrage à midi, solstice d'hiver)" },
              ]} />
            <NumberField label="Retrait en bordure" unit="m" value={project.layout.setbackM} min={0} onChange={(v) => setL({ setbackM: v })} />
            <NumberField label="Jeu entre modules" unit="m" value={project.layout.moduleGapM} min={0} onChange={(v) => setL({ moduleGapM: v })} />
            <NumberField label="Allée entre rangées" unit="m" hint="Pose inclinée (sol / terrasse). En pose coplanaire, les rangées sont jointives." value={project.layout.rowSpacingM} min={0} onChange={(v) => setL({ rowSpacingM: v })} />
            <NumberField label="Allée de maintenance toutes les" unit="rangées" hint="0 = aucune" value={project.layout.corridorEveryRows} min={0} step={1} onChange={(v) => setL({ corridorEveryRows: Math.round(v) })} />
            <NumberField label="Largeur de l'allée de maintenance" unit="m" value={project.layout.corridorWidthM} min={0} onChange={(v) => setL({ corridorWidthM: v })} />
            <NumberField label="Angle des rangées" unit="°" hint="Vide = aligné sur l'arête la plus longue de l'emprise." value={project.layout.rowAngleDeg ?? 0}
              onChange={(v) => setL({ rowAngleDeg: v })} />
            {project.layout.rowAngleDeg !== null && (
              <button type="button" className="text-xs text-primary underline" onClick={() => setL({ rowAngleDeg: null })}>Revenir à l'alignement automatique</button>
            )}
          </div>
        </Section>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi label="Modules placés" value={`${L.moduleCount}`} note={`${L.rows} rangées × ${L.columns} col.`} />
            <Kpi label="Puissance DC possible" value={L.dcPowerKwp.toFixed(2)} unit="kWc" note={study.module.model} />
            <Kpi label="Surface occupée" value={L.occupiedAreaM2.toFixed(1)} unit="m²" note={`sur ${L.areaM2.toFixed(1)} m²`} />
            <Kpi label="Surface restante" value={L.remainingAreaM2.toFixed(1)} unit="m²" note={L.source === "polygone" ? "emprise dessinée" : "rectangle L × l"} />
          </div>
          <LayoutDrawing layout={L} modulesPerString={project.selection.modulesPerString} stringCount={project.selection.stringCount}
            tiltDeg={project.area.tiltDeg} azimuthDeg={project.area.azimuthDeg} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            <span>
              Configuration électrique : <b className="numeric">{study.sizing.moduleCount}</b> modules ({project.selection.stringCount} × {project.selection.modulesPerString}) —
              calepinage : <b className="numeric">{L.moduleCount}</b> emplacements.
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={matchLayout} className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Ajuster les chaînes au calepinage
              </button>
              <Link to="/unifilaire" className="rounded-sm border border-border px-3 py-1.5 text-xs font-semibold">Schéma unifilaire →</Link>
            </div>
          </div>
          <p className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-xs">{LAYOUT_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}

function NoProject() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="text-2xl font-bold">Aucun projet actif</h1>
      <p className="mt-3 text-sm text-muted-foreground">Ouvrez ou créez une étude pour continuer.</p>
      <Link to="/etude" className="mt-6 inline-flex rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Ouvrir l'assistant</Link>
    </div>
  );
}
