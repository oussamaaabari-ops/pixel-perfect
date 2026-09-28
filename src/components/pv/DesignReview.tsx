import { Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { StudyResult } from "@/lib/pv/calc";
import { buildReviewDossier, loadReview, saveReview } from "@/lib/pv/review";
import type { Project } from "@/lib/pv/types";

export function DesignReview({ project, study }: { project: Project; study: StudyResult }) {
  const [text, setText] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [at, setAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const r = loadReview(project.id);
    setText(r?.text ?? "");
    setAt(r?.at ?? null);
  }, [project.id]);

  async function run() {
    setBusy(true); setError(null); setText(""); setReasoning("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let acc = "";
    try {
      const res = await fetch("/api/design-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier: buildReviewDossier(project, study) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Erreur ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          let ev: { type?: string; delta?: string; response?: { error?: { message?: string } }; message?: string };
          try { ev = JSON.parse(data); } catch { continue; }
          if (ev.type === "response.output_text.delta" && ev.delta) { acc += ev.delta; setText(acc); }
          else if (ev.type === "response.reasoning_summary_text.delta" && ev.delta) setReasoning((r) => r + ev.delta);
          else if (ev.type === "response.failed" || ev.type === "error")
            throw new Error(ev.response?.error?.message || ev.message || "La revue IA a échoué.");
        }
      }
      if (!acc.trim()) throw new Error("Le modèle n'a renvoyé aucune réponse.");
      const now = new Date().toISOString();
      saveReview(project.id, { text: acc, at: now });
      setAt(now);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {busy ? (
          <button type="button" onClick={() => abortRef.current?.abort()} className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium">
            <Square className="size-3.5" /> Arrêter
          </button>
        ) : (
          <button type="button" onClick={run} className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground">
            <Sparkles className="size-3.5" /> {text ? "Relancer la revue IA" : "Lancer la revue IA de la conception"}
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          Envoie le site, le calepinage, les chaînes, les protections et les câbles du projet au modèle d'IA.
          {at && !busy && ` Dernière revue : ${new Date(at).toLocaleString("fr-FR")}.`}
        </span>
      </div>
      {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {busy && !text && (
        <p className="whitespace-pre-wrap rounded-md border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
          {reasoning || "Analyse de la conception en cours…"}
        </p>
      )}
      {text && <ReviewText text={text} />}
      <p className="text-[11px] text-muted-foreground">Revue automatisée indicative : elle ne remplace pas la validation par un professionnel qualifié.</p>
    </div>
  );
}

export function ReviewText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-card px-5 py-4 text-sm leading-relaxed">
      {text.split("\n").map((l, i) => {
        const clean = l.replace(/\*\*(.+?)\*\*/g, "$1");
        if (l.startsWith("## ") || l.startsWith("### "))
          return <h3 key={i} className="pt-3 font-display text-[13px] font-semibold uppercase tracking-wide">{clean.replace(/^#+\s/, "")}</h3>;
        if (!l.trim()) return null;
        return <p key={i}>{clean}</p>;
      })}
    </div>
  );
}
