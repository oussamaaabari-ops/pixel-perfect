import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";
const RUN_HEADER = "X-Lovable-AIG-Run-ID";

const SYSTEM = `Tu es un ingénieur photovoltaïque senior qui relit une conception PRÉLIMINAIRE (pré-dimensionnement) produite par l'outil SOLARA ENGINEERING.
On te fournit un dossier JSON : site, emprise, calepinage, configuration des chaînes, module, onduleur, protections, câbles et vérifications automatiques.
Règles :
- Réponds en français technique professionnel, en Markdown concis.
- N'invente AUCUNE donnée (météo, spécification fabricant, norme chiffrée non justifiée). Si une information manque, dis-le.
- Appuie chaque remarque sur les valeurs du dossier (cite-les avec unités).
Structure :
## Synthèse (3 lignes max, verdict global)
## Points critiques (✕) — à corriger avant toute suite
## Points de vigilance (⚠)
## Corrections recommandées — liste numérotée d'actions concrètes (paramètre → nouvelle valeur ou plage, raison)
## Informations manquantes
Termine par : « Revue automatisée indicative — à valider par un professionnel qualifié. »`;

const Body = z.object({ dossier: z.record(z.unknown()), runId: z.string().max(200).optional() });

export const Route = createFileRoute("/api/design-review")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Service d'IA non configuré." }, { status: 500 });
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Dossier de conception invalide." }, { status: 400 });
        }
        const json = JSON.stringify(body.dossier);
        if (json.length > 60000) return Response.json({ error: "Dossier trop volumineux." }, { status: 400 });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        };
        if (body.runId) headers[RUN_HEADER] = body.runId;
        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            signal: request.signal,
            headers,
            body: JSON.stringify({
              model: MODEL,
              stream: true,
              store: false,
              reasoning: { effort: "medium", summary: "auto" },
              include: ["reasoning.encrypted_content"],
              instructions: SYSTEM,
              input: [{ role: "user", content: `Dossier de conception :\n${json}` }],
            }),
          });
          if (!upstream.ok) {
            let msg = "La revue IA a échoué.";
            try {
              const e = await upstream.json();
              msg = e?.error?.message || e?.message || msg;
            } catch { /* ignore */ }
            if (upstream.status === 402) msg = `Crédits IA insuffisants. ${msg}`;
            if (upstream.status === 429) msg = "Trop de demandes, réessayez dans un instant.";
            return Response.json({ error: msg }, { status: upstream.status });
          }
          const out = new Headers({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
          const rid = upstream.headers.get(RUN_HEADER);
          if (rid) out.set(RUN_HEADER, rid);
          return new Response(upstream.body, { status: 200, headers: out });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }
      },
    },
  },
});
