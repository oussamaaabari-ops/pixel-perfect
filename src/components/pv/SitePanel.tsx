import { lazy, Suspense, useEffect, useState } from "react";
import { centroidLatLng, polygonArea, polygonDimensions, toLatLng, toLocal } from "@/lib/pv/geo";
import type { LayoutResult } from "@/lib/pv/layout";
import type { LatLng, Project } from "@/lib/pv/types";

const SiteMap = lazy(() => import("./SiteMap").then((m) => ({ default: m.SiteMap })));

/** Carte du site + synthèse de l'emprise. Met à jour le modèle central du projet. */
export function SitePanel({
  project,
  update,
  layout,
  height,
}: {
  project: Project;
  update: (fn: (p: Project) => Project) => void;
  layout?: LayoutResult | undefined;
  height?: number | undefined;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const poly = project.site.polygon;
  const local = poly.length >= 3 ? toLocal(poly) : [];
  const area = local.length ? polygonArea(local) : 0;
  const dims = local.length ? polygonDimensions(local) : null;
  const overlay =
    layout && layout.source === "polygone" && poly.length >= 3
      ? layout.modules.map((m) => toLatLng(m.corners, centroidLatLng(poly)))
      : undefined;

  const setPolygon = (next: LatLng[]) =>
    update((p) => {
      const l = next.length >= 3 ? toLocal(next) : [];
      const d = l.length ? polygonDimensions(l) : null;
      return {
        ...p,
        site: { ...p.site, polygon: next },
        area: d
          ? {
              ...p.area,
              availableAreaM2: Math.round(polygonArea(l) * 10) / 10,
              roofLengthM: Math.round(d.lengthM * 10) / 10,
              roofWidthM: Math.round(d.widthM * 10) / 10,
            }
          : p.area,
      };
    });

  return (
    <div className="space-y-3">
      {mounted ? (
        <Suspense fallback={<div style={{ height: height ?? 420 }} className="rounded-md border border-border bg-muted" />}>
          <SiteMap
            lat={project.info.latitude}
            lng={project.info.longitude}
            polygon={poly}
            overlay={overlay}
            height={height}
            onLocation={(lat, lng, label, alt) =>
              update((p) => ({
                ...p,
                info: {
                  ...p.info,
                  latitude: Math.round(lat * 1e5) / 1e5,
                  longitude: Math.round(lng * 1e5) / 1e5,
                  ...(label ? { address: label } : {}),
                },
                site: { ...p.site, label: label ?? p.site.label, altitudeM: alt },
              }))
            }
            onPolygon={setPolygon}
          />
        </Suspense>
      ) : (
        <div style={{ height: height ?? 420 }} className="rounded-md border border-border bg-muted" />
      )}
      <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border text-xs sm:grid-cols-3 lg:grid-cols-6">
        <Cell k="Site" v={project.site.label || "—"} wide />
        <Cell k="Latitude" v={`${project.info.latitude.toFixed(4)}°`} />
        <Cell k="Longitude" v={`${project.info.longitude.toFixed(4)}°`} />
        <Cell k="Altitude (approx.)" v={project.site.altitudeM !== null ? `${Math.round(project.site.altitudeM)} m` : "non disponible"} />
        <Cell k="Emprise dessinée" v={area ? `${area.toFixed(1)} m²` : "aucune"} />
        <Cell k="Dimensions approx." v={dims ? `${dims.lengthM.toFixed(1)} × ${dims.widthM.toFixed(1)} m · axe ${dims.edgeAngleDeg.toFixed(0)}°` : "—"} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Les coordonnées servent à localiser le projet ; aucune donnée d'irradiation n'est déduite automatiquement (connexion PVGIS / base météo prévue).
      </p>
    </div>
  );
}

function Cell({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`bg-card px-3 py-2 ${wide ? "sm:col-span-3 lg:col-span-1" : ""}`}>
      <p className="label-technical">{k}</p>
      <p className="numeric mt-0.5 truncate font-medium" title={v}>{v}</p>
    </div>
  );
}
