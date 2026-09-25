import { Info } from "lucide-react";
import type { ReactNode } from "react";

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="size-3.5 cursor-help text-muted-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-sm border border-border bg-popover p-2 text-[11px] leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function FieldShell({
  label,
  unit,
  hint,
  error,
  children,
}: {
  label: string;
  unit?: string | undefined;
  hint?: string | undefined;
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
        {label}
        {unit && <span className="font-mono text-[11px] text-muted-foreground">[{unit}]</span>}
        {hint && <Hint text={hint} />}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm numeric outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

export function NumberField({
  label,
  unit,
  hint,
  value,
  onChange,
  min,
  max,
  step = "any",
}: {
  label: string;
  unit?: string | undefined;
  hint?: string | undefined;
  value: number;
  onChange: (v: number) => void;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | "any";
}) {
  const error =
    min !== undefined && value < min
      ? `Valeur inférieure au minimum admis (${min}).`
      : max !== undefined && value > max
        ? `Valeur supérieure au maximum admis (${max}).`
        : Number.isFinite(value)
          ? null
          : "Valeur numérique invalide.";

  return (
    <FieldShell label={label} unit={unit} hint={hint} error={error}>
      <input
        type="number"
        className={inputClass}
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </FieldShell>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string | undefined;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <input
        type="text"
        className={inputClass.replace(" numeric", "")}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string | undefined;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <select
        className={inputClass.replace(" numeric", "")}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
