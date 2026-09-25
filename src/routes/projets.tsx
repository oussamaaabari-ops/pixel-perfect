import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, FilePlus2, FileText, Pencil, Trash2 } from "lucide-react";
import { runStudy } from "@/lib/pv/calc";
import { money, num } from "@/lib/pv/format";
import {
  createEmptyProject,
  deleteProject,
  duplicateProject,
  saveProject,
  setActiveProjectId,
  useProjects,
} from "@/lib/pv/store";

export const Route = createFileRoute("/projets")({
  head: () => ({
    meta: [
      { title: "Mes projets — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Tableau de bord des études photovoltaïques enregistrées : puissance, production annuelle estimée, statut et dernière modification.",
      },
      { property: "og:title", content: "Mes projets — SOLARA ENGINEERING" },
      {
        property: "og:description",
        content: "Créez, dupliquez et reprenez vos études de pré-dimensionnement PV.",
      },
    ],
  }),
  component: Projets,
});

function Projets() {
  const projects = useProjects();
  const navigate = useNavigate();

  const open = (id: string, to: "/etude" | "/resultats" | "/rapport") => {
    setActiveProjectId(id);
    navigate({ to });
  };

  const create = () => {
    const p = createEmptyProject();
    saveProject(p);
    setActiveProjectId(p.id);
    navigate({ to: "/etude" });
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Espace de travail</p>
          <h1 className="mt-3 text-3xl font-bold">Mes projets</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Les études sont enregistrées localement dans ce navigateur. Un espace
            multi-utilisateurs pourra être ajouté ultérieurement.
          </p>
        </div>
        <button
          type="button"
          onClick={create}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          <FilePlus2 className="size-4" /> Nouveau projet
        </button>
      </header>

      <div className="mt-8 overflow-hidden rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                {[
                  "Projet",
                  "Localisation",
                  "Puissance PV",
                  "Production annuelle",
                  "Temps de retour",
                  "Statut",
                  "Mise à jour",
                  "",
                ].map((h) => (
                  <th key={h} className="label-technical px-4 py-3 text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun projet enregistré.{" "}
                    <button onClick={create} className="font-medium text-accent underline">
                      Créer une première étude
                    </button>
                  </td>
                </tr>
              )}
              {projects.map((p) => {
                const study = runStudy(p);
                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => open(p.id, "/resultats")}
                        className="text-left font-medium hover:text-accent"
                      >
                        {p.info.name}
                      </button>
                      {p.isDemo && (
                        <span className="mt-1 block font-mono text-[10px] tracking-wider text-warning-foreground">
                          DÉMO — USAGE NON PROFESSIONNEL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[p.info.city, p.info.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="numeric px-4 py-3">{num(study.sizing.dcPowerKwp, 2)} kWc</td>
                    <td className="numeric px-4 py-3">
                      {num(study.energy.annualProductionKwh)} kWh/an
                    </td>
                    <td className="numeric px-4 py-3">
                      {study.finance.simplePaybackYears
                        ? `${num(study.finance.simplePaybackYears, 1)} ans`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-sm border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {p.status === "calcule" ? "Calculé" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Modifier"
                          onClick={() => open(p.id, "/etude")}
                          className="grid size-8 place-items-center rounded-sm border border-border hover:bg-secondary"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          title="Rapport"
                          onClick={() => open(p.id, "/rapport")}
                          className="grid size-8 place-items-center rounded-sm border border-border hover:bg-secondary"
                        >
                          <FileText className="size-3.5" />
                        </button>
                        <button
                          title="Dupliquer"
                          onClick={() => duplicateProject(p.id)}
                          className="grid size-8 place-items-center rounded-sm border border-border hover:bg-secondary"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => {
                            if (confirm(`Supprimer « ${p.info.name} » ?`)) deleteProject(p.id);
                          }}
                          className="grid size-8 place-items-center rounded-sm border border-border text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(() => {
            const totals = projects.reduce(
              (acc, p) => {
                const s = runStudy(p);
                acc.kwp += s.sizing.dcPowerKwp;
                acc.kwh += s.energy.annualProductionKwh;
                acc.capex += s.finance.capex;
                return acc;
              },
              { kwp: 0, kwh: 0, capex: 0 },
            );
            return (
              <>
                <Stat label="Portefeuille — puissance" value={`${num(totals.kwp, 2)} kWc`} />
                <Stat label="Production annuelle cumulée" value={`${num(totals.kwh)} kWh/an`} />
                <Stat
                  label="CAPEX cumulé (devises non converties)"
                  value={money(totals.capex, projects[0].info.currency)}
                />
              </>
            );
          })()}
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Besoin d'un point de départ ? Ouvrez le projet de démonstration puis{" "}
        <Link to="/etude" className="underline">
          modifiez ses hypothèses
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="label-technical">{label}</p>
      <p className="numeric mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
