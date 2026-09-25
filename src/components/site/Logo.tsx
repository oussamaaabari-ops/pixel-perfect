import { BRAND } from "@/lib/brand";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-8 place-items-center rounded-sm bg-primary">
        <span className="absolute inset-0 rounded-sm tech-grid-fine opacity-30" />
        <svg viewBox="0 0 24 24" className="relative size-4.5" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" className="fill-accent" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-primary-foreground">
            <line x1="12" y1="1.5" x2="12" y2="4.5" />
            <line x1="12" y1="19.5" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4.5" y2="12" />
            <line x1="19.5" y1="12" x2="22.5" y2="12" />
          </g>
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold tracking-tight">{BRAND.name}</span>
        {!compact && (
          <span className="mt-0.5 font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
            {BRAND.suffix}
          </span>
        )}
      </span>
    </span>
  );
}
