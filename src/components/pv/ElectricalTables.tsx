import type { CableResult, ProtectionItem } from "@/lib/pv/electrical";

const STATUS = {
  ok: { icon: "✓", label: "Acceptable", cls: "text-success" },
  warning: { icon: "⚠", label: "À vérifier", cls: "text-warning" },
  error: { icon: "✕", label: "Non acceptable", cls: "text-destructive" },
} as const;

export function ProtectionTable({ items }: { items: ProtectionItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="label-technical border-b border-border">
          <tr>
            <th className="py-2 pr-3">Côté</th>
            <th className="py-2 pr-3">Organe</th>
            <th className="py-2 pr-3">Calibre préliminaire</th>
            <th className="py-2">Justification</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-b border-border/70 align-top">
              <td className="py-2 pr-3">
                <span className={`numeric rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${p.side === "DC" ? "bg-accent/25" : "bg-primary/10 text-primary"}`}>{p.side}</span>
              </td>
              <td className="py-2 pr-3 font-medium">{p.label}</td>
              <td className={`numeric py-2 pr-3 ${p.required ? "" : "text-muted-foreground"}`}>{p.rating}</td>
              <td className="py-2 text-muted-foreground">{p.basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CableTable({ cables }: { cables: CableResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="label-technical border-b border-border">
          <tr>
            <th className="py-2 pr-3">Liaison</th>
            <th className="py-2 pr-3">I calcul</th>
            <th className="py-2 pr-3">Longueur</th>
            <th className="py-2 pr-3">Section</th>
            <th className="py-2 pr-3">Iz</th>
            <th className="py-2 pr-3">ΔU</th>
            <th className="py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {cables.map((c) => {
            const s = STATUS[c.status];
            return (
              <tr key={c.id} className="border-b border-border/70 align-top">
                <td className="py-2 pr-3 font-medium">{c.label}{c.note && <p className="mt-1 font-normal text-muted-foreground">{c.note}</p>}</td>
                <td className="numeric py-2 pr-3">{c.designCurrentA.toFixed(1)} A</td>
                <td className="numeric py-2 pr-3">{c.lengthM} m</td>
                <td className="numeric py-2 pr-3 font-semibold">{c.sectionMm2 ? `${c.sectionMm2} mm²` : "—"}</td>
                <td className="numeric py-2 pr-3">{c.ampacityA.toFixed(0)} A</td>
                <td className="numeric py-2 pr-3">{c.voltageDropV.toFixed(2)} V · {c.voltageDropPct.toFixed(2)} % / {c.maxDropPct} %</td>
                <td className={`py-2 font-semibold ${s.cls}`}>{s.icon} {s.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
