import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Battery,
  CircuitBoard,
  FileText,
  Gauge,
  LineChart,
  ShieldCheck,
  Sun,
  Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOLARA ENGINEERING — Pré-dimensionnement photovoltaïque" },
      {
        name: "description",
        content:
          "Dimensionnez un système photovoltaïque avant construction : puissance PV, configuration des chaînes, production estimée, autoconsommation et analyse économique préliminaire.",
      },
      { property: "og:title", content: "Dimensionnez votre système PV avant de le construire" },
      {
        property: "og:description",
        content:
          "Pré-dimensionnement PV, estimation de production, économie du projet et rapport préliminaire professionnel.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  { n: "01", title: "Projet & site", text: "Type de projet, localisation, raccordement, tarif et devise." },
  { n: "02", title: "Consommation", text: "Saisie annuelle ou mensuelle, qualité de la donnée, répartition." },
  { n: "03", title: "Zone d'implantation", text: "Surface, inclinaison, azimut, ombrage, capacité géométrique." },
  { n: "04", title: "Module & onduleur", text: "Sélection dans la bibliothèque, caractéristiques électriques." },
  { n: "05", title: "Configuration des chaînes", text: "Vérifications de tension, courant et limites MPPT." },
  { n: "06", title: "Production & pertes", text: "Irradiation, pertes détaillées, rendement spécifique et PR." },
  { n: "07", title: "Économie & rapport", text: "CAPEX, économies, temps de retour, CO₂ évité, rapport." },
];

const FEATURES = [
  {
    icon: Sun,
    title: "Dimensionnement PV",
    text: "Puissance installée, nombre de modules, capacité géométrique de la surface et configuration électrique distinguées explicitement.",
  },
  {
    icon: CircuitBoard,
    title: "Configuration des chaînes",
    text: "Tension à vide corrigée en température, plage MPPT, courant par MPPT et nombre d'entrées vérifiés à chaque modification.",
  },
  {
    icon: LineChart,
    title: "Production énergétique",
    text: "Modèle préliminaire avec pertes paramétrables, rendement spécifique et ratio de performance calculés de façon transparente.",
  },
  {
    icon: Gauge,
    title: "Autoconsommation",
    text: "Bilan mensuel simplifié : autoconsommation, injection, soutirage, taux d'autoproduction et d'autoconsommation.",
  },
  {
    icon: Battery,
    title: "Stockage",
    text: "Capacité recommandée, énergie utile et autonomie indicative, avec les limites d'un calcul sans profil horaire.",
  },
  {
    icon: Wallet,
    title: "Analyse économique",
    text: "CAPEX détaillé, OPEX, économies annuelles, temps de retour simple, flux de trésorerie sur la durée de vie.",
  },
  {
    icon: ShieldCheck,
    title: "Vérifications d'ingénierie",
    text: "Chaque écart est signalé avec sa raison technique. Aucune configuration invalide n'est acceptée silencieusement.",
  },
  {
    icon: FileText,
    title: "Rapport préliminaire",
    text: "Document structuré, imprimable, incluant hypothèses, méthodologie et limites de validité de l'étude.",
  },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 tech-grid opacity-60" aria-hidden />
        <div
          className="absolute -top-40 right-[-10%] size-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div>
            <p className="label-technical">Plateforme d'ingénierie PV · Pré-dimensionnement</p>
            <h1 className="mt-5 max-w-2xl text-4xl leading-[1.08] font-bold md:text-5xl lg:text-[3.4rem]">
              Dimensionnez votre système solaire avant de le construire.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Pré-dimensionnez des installations photovoltaïques, estimez la production
              énergétique, évaluez l'économie du projet et générez une conception
              préliminaire professionnelle en quelques minutes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/etude"
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                Démarrer une étude PV <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/methodologie"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Explorer la méthodologie
              </Link>
            </div>
            <p className="mt-8 max-w-xl border-l-2 border-accent/60 pl-4 text-xs leading-relaxed text-muted-foreground">
              Les résultats sont des estimations de pré-dimensionnement. Ils doivent être
              validés par un ingénieur qualifié avant toute réalisation.
            </p>
          </div>

          <HeroPanel />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <p className="label-technical">Déroulé de l'étude</p>
        <h2 className="mt-3 text-3xl font-bold">Comment ça fonctionne</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-card p-5">
              <span className="numeric text-xs font-semibold text-accent">{s.n}</span>
              <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <p className="label-technical">Capacités de la plateforme</p>
          <h2 className="mt-3 text-3xl font-bold">Une chaîne de calcul complète</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-md border border-border bg-card p-5">
                <f.icon className="size-5 text-accent" />
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="label-technical">Pourquoi {BRAND.name}</p>
            <h2 className="mt-3 text-3xl font-bold">Conçu pour le travail d'ingénierie, pas pour la vente</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Les hypothèses sont visibles, modifiables et documentées. Les sources de
              données d'irradiation sont affichées. Les caractéristiques d'équipement de
              démonstration sont explicitement signalées et remplaçables par des fiches
              techniques réelles.
            </p>
            <Link
              to="/etude"
              className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Lancer un pré-dimensionnement <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {[
              ["Hypothèses explicites", "Chaque perte, tarif et facteur d'émission est saisi et affiché."],
              ["Aucune donnée inventée", "Pas de météo ni de fiche constructeur fabriquée par la plateforme."],
              ["Vérifications visibles", "Statuts Conforme / Avertissement / Erreur avec justification technique."],
              ["Moteur modulaire", "Calculs séparés de l'interface, prêts pour la simulation horaire."],
              ["Unités partout", "kWc, kWh/an, kWh/m²/an, V, A, °C, m² — jamais d'unité implicite."],
              ["Rapport exploitable", "Structure de rapport d'étude préliminaire prête à imprimer."],
            ].map(([t, d]) => (
              <li key={t} className="bg-card p-5">
                <h3 className="text-sm font-semibold">{t}</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function HeroPanel() {
  const bars = [38, 46, 62, 70, 82, 88, 92, 86, 72, 58, 43, 35];
  return (
    <div className="relative">
      <div className="rounded-md border border-border bg-card shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="label-technical">Aperçu — tableau de bord d'étude</span>
          <BarChart3 className="size-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-3 gap-px bg-border">
          {[
            ["Puissance PV", "5,00", "kWc"],
            ["Production", "7 850", "kWh/an"],
            ["Ratio DC/AC", "1,00", "—"],
          ].map(([l, v, u]) => (
            <div key={l} className="bg-card p-4">
              <p className="label-technical">{l}</p>
              <p className="numeric mt-1.5 text-lg font-semibold">
                {v} <span className="text-[11px] font-normal text-muted-foreground">{u}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="p-4">
          <p className="label-technical">Production mensuelle estimée · kWh</p>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[2px] bg-accent/85"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground">
            <span>JAN</span>
            <span>AVR</span>
            <span>JUIL</span>
            <span>OCT</span>
            <span>DÉC</span>
          </div>
        </div>
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            Vérifications électriques : tension de chaîne, plage MPPT, courant par MPPT
          </div>
        </div>
      </div>
    </div>
  );
}
