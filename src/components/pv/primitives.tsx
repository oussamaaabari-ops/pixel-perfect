import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { EngineeringCheck } from "@/lib/pv/types";

export function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string | undefined;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {aside}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string | undefined;
  note?: string | undefined;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="label-technical">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="numeric text-2xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="numeric text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

export function DemoBadge({ children = "DONNÉES DE DÉMONSTRATION" }: { children?: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-warning-foreground">
      {children}
    </span>
  );
}

export function CheckList({ checks }: { checks: EngineeringCheck[] }) {
  return (
    <ul className="space-y-2">
      {checks.map((c) => {
        const Icon =
          c.status === "ok" ? CheckCircle2 : c.status === "warning" ? AlertTriangle : XCircle;
        const tone =
          c.status === "ok"
            ? "text-success border-success/30 bg-success/5"
            : c.status === "warning"
              ? "text-warning-foreground border-warning/40 bg-warning/10"
              : "text-destructive border-destructive/30 bg-destructive/5";
        return (
          <li key={c.id} className={`rounded-sm border px-4 py-3 ${tone}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-foreground">{c.label}</p>
                  {c.value && (
                    <p className="numeric text-[12px] text-muted-foreground">
                      {c.value}
                      {c.limit ? ` · limite ${c.limit}` : ""}
                    </p>
                  )}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
