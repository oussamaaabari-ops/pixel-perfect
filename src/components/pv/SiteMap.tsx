/**
 * Carte interactive du site (Leaflet, chargé côté navigateur uniquement).
 * Fonds : OpenStreetMap (plan) et Esri World Imagery (satellite).
 * Recherche : Nominatim ; altitude : API Open-Meteo Elevation (approx. MNT 90 m).
 * Point d'extension futur : imagerie haute résolution, détection de toiture, MNT.
 */
import { useEffect, useRef, useState } from "react";
import { Crosshair, Eraser, MousePointer2, Pentagon, Search, Square } from "lucide-react";
import type { LatLng } from "@/lib/pv/types";
import { rectangleFromCorners } from "@/lib/pv/geo";

type Mode = "point" | "polygone" | "rectangle";

export interface SiteMapProps {
  lat: number;
  lng: number;
  polygon: LatLng[];
  overlay?: LatLng[][] | undefined; // modules calepinés
  onLocation: (lat: number, lng: number, label: string | null, altitudeM: number | null) => void;
  onPolygon: (poly: LatLng[]) => void;
  height?: number | undefined;
}

async function fetchAltitude(lat: number, lng: number): Promise<number | null> {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    const j = (await r.json()) as { elevation?: number[] };
    const v = j.elevation?.[0];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

async function reverse(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=fr&lat=${lat}&lon=${lng}`,
    );
    const j = (await r.json()) as { address?: Record<string, string>; display_name?: string };
    const a = j.address ?? {};
    const city = a.city || a.town || a.village || a.county || "";
    return [city, a.country].filter(Boolean).join(", ") || j.display_name || null;
  } catch {
    return null;
  }
}

export function SiteMap({ lat, lng, polygon, overlay, onLocation, onPolygon, height = 420 }: SiteMapProps) {
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = useRef<{ marker?: any; poly?: any; vertices?: any; overlay?: any; draft?: any }>({});
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("point");
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cb = useRef({ onLocation, onPolygon, mode, draft });
  cb.current = { onLocation, onPolygon, mode, draft };

  const pickLocation = async (la: number, ln: number, label: string | null = null) => {
    const [alt, name] = await Promise.all([fetchAltitude(la, ln), label ? Promise.resolve(label) : reverse(la, ln)]);
    cb.current.onLocation(la, ln, name, alt);
  };

  // Initialisation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(el.current, { zoomControl: true }).setView([lat, lng], polygon.length ? 18 : 16);
      const sat = leaflet.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, maxNativeZoom: 19, attribution: "Imagerie © Esri, Maxar, Earthstar Geographics" },
      );
      const osm = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: "© OpenStreetMap",
      });
      sat.addTo(m);
      leaflet.control.layers({ Satellite: sat, Plan: osm }).addTo(m);
      leaflet.control.scale({ imperial: false }).addTo(m);
      m.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const p: LatLng = [e.latlng.lat, e.latlng.lng];
        const c = cb.current;
        if (c.mode === "point") void pickLocation(p[0], p[1]);
        else if (c.mode === "polygone") setDraft((d) => [...d, p]);
        else {
          const d = c.draft;
          if (d.length === 0) setDraft([p]);
          else {
            c.onPolygon(rectangleFromCorners(d[0]!, p));
            setDraft([]);
            setMode("point");
          }
        }
      });
      m.on("dblclick", () => {
        const c = cb.current;
        if (c.mode === "polygone" && c.draft.length >= 3) {
          c.onPolygon(c.draft);
          setDraft([]);
          setMode("point");
        }
      });
      map.current = m;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Double-clic : pas de zoom pendant le dessin
  useEffect(() => {
    if (!map.current) return;
    if (mode === "polygone") map.current.doubleClickZoom.disable();
    else map.current.doubleClickZoom.enable();
    map.current.getContainer().style.cursor = mode === "point" ? "" : "crosshair";
  }, [mode, ready]);

  // Marqueur
  useEffect(() => {
    const leaflet = L.current;
    if (!ready || !leaflet) return;
    if (!layers.current.marker) {
      const icon = leaflet.divIcon({
        className: "",
        html: '<div class="solara-pin"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const mk = leaflet.marker([lat, lng], { draggable: true, icon }).addTo(map.current);
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        void pickLocation(p.lat, p.lng);
      });
      layers.current.marker = mk;
    } else layers.current.marker.setLatLng([lat, lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, ready]);

  // Polygone + sommets éditables
  useEffect(() => {
    const leaflet = L.current;
    if (!ready || !leaflet) return;
    layers.current.poly?.remove();
    layers.current.vertices?.remove();
    if (polygon.length >= 3) {
      layers.current.poly = leaflet
        .polygon(polygon, { color: "#F4B942", weight: 2, fillColor: "#F4B942", fillOpacity: 0.12, interactive: false })
        .addTo(map.current);
      const group = leaflet.layerGroup();
      polygon.forEach((pt, i) => {
        const v = leaflet.marker(pt, {
          draggable: true,
          icon: leaflet.divIcon({ className: "", html: '<div class="solara-vertex"></div>', iconSize: [12, 12], iconAnchor: [6, 6] }),
        });
        v.on("dragend", () => {
          const p = v.getLatLng();
          const next = polygon.map((q, j) => (j === i ? ([p.lat, p.lng] as LatLng) : q));
          cb.current.onPolygon(next);
        });
        group.addLayer(v);
      });
      group.addTo(map.current);
      layers.current.vertices = group;
    }
  }, [polygon, ready]);

  // Brouillon
  useEffect(() => {
    const leaflet = L.current;
    if (!ready || !leaflet) return;
    layers.current.draft?.remove();
    if (draft.length) {
      layers.current.draft = leaflet
        .polyline(draft, { color: "#F4B942", dashArray: "4 4", weight: 2 })
        .addTo(map.current);
    }
  }, [draft, ready]);

  // Modules calepinés
  useEffect(() => {
    const leaflet = L.current;
    if (!ready || !leaflet) return;
    layers.current.overlay?.remove();
    if (overlay?.length) {
      const g = leaflet.layerGroup(
        overlay.map((c) =>
          leaflet.polygon(c, { color: "#0F2A4A", weight: 0.6, fillColor: "#1E4E8C", fillOpacity: 0.85, interactive: false }),
        ),
      );
      g.addTo(map.current);
      layers.current.overlay = g;
    }
  }, [overlay, ready]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fr&q=${encodeURIComponent(query)}`,
      );
      const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
      const hit = j[0];
      if (!hit) {
        setError("Aucun résultat pour cette recherche.");
        return;
      }
      const la = Number(hit.lat);
      const ln = Number(hit.lon);
      map.current?.setView([la, ln], 17);
      await pickLocation(la, ln, hit.display_name.split(",").slice(0, 3).join(","));
    } catch {
      setError("Recherche indisponible (connexion au service de géocodage).");
    } finally {
      setSearching(false);
    }
  };

  const tool = (m: Mode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setDraft([]);
      }}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium ${
        mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-[240px] flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ville ou une adresse…"
            className="h-8 flex-1 rounded-sm border border-input bg-card px-2.5 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="inline-flex h-8 items-center gap-1 rounded-sm bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <Search className="size-3.5" />
            {searching ? "…" : "Chercher"}
          </button>
        </form>
        {tool("point", <MousePointer2 className="size-3.5" />, "Localiser")}
        {tool("polygone", <Pentagon className="size-3.5" />, "Polygone")}
        {tool("rectangle", <Square className="size-3.5" />, "Rectangle")}
        <button
          type="button"
          onClick={() => {
            if (polygon.length && map.current && L.current) map.current.fitBounds(L.current.latLngBounds(polygon), { padding: [30, 30] });
            else map.current?.setView([lat, lng], 17);
          }}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Crosshair className="size-3.5" /> Centrer
        </button>
        {polygon.length > 0 && (
          <button
            type="button"
            onClick={() => onPolygon([])}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs text-destructive"
          >
            <Eraser className="size-3.5" /> Effacer l'emprise
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[11px] text-muted-foreground">
        {mode === "point" && "Cliquez sur la carte ou déplacez le repère pour fixer le site. Les sommets de l'emprise sont déplaçables."}
        {mode === "polygone" && `Cliquez pour ajouter des sommets (${draft.length}) ; double-cliquez pour fermer le polygone (≥ 3 sommets).`}
        {mode === "rectangle" && (draft.length ? "Cliquez sur le coin opposé." : "Cliquez sur un premier coin.")}
      </p>
      <div ref={el} style={{ height }} className="z-0 overflow-hidden rounded-md border border-border bg-muted" />
    </div>
  );
}
