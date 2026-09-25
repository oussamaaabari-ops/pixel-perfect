import { createFileRoute, Link } from "@tanstack/react-router";
import { Section } from "@/components/pv/primitives";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "SOLARA ENGINEERING est une plateforme d'ingénierie destinée aux bureaux d'études, installateurs et techniciens pour le pré-dimensionnement photovoltaïque.",
      },
      { property: "og:title", content: "À propos — SOLARA ENGINEERING" },
      {
        property: "og:description",
        content: "Plateforme de pré-dimensionnement PV pour bureaux d'études et installateurs.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-14">
      <header>
        <p className="label-technical">Présentation</p>
        <h1 className="mt-3 text-3xl font-bold">À propos de {BRAND.fullName}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {BRAND.fullName} est une plateforme d'ingénierie destinée aux ingénieurs,
          techniciens, installateurs, bureaux d'études et clients à profil technique. Elle
          formalise l'étape de pré-dimensionnement d'un système photovoltaïque : hypothèses,
          configuration électrique, estimation de production, économie du projet et rapport.
        </p>
      </header>

      <Section title="Positionnement">
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Transparence des calculs.</strong> Chaque
            résultat est reproductible à partir des formules publiées dans la page
            méthodologie.
          </li>
          <li>
            <strong className="text-foreground">Pas de données fabriquées.</strong> La
            plateforme n'invente ni données météorologiques, ni fiches techniques
            constructeur. Les équipements fournis par défaut sont signalés comme données de
            démonstration.
          </li>
          <li>
            <strong className="text-foreground">Limites assumées.</strong> Le modèle est
            mensuel et simplifié ; il ne remplace pas une simulation horaire ni une note de
            calcul d'exécution.
          </li>
        </ul>
      </Section>

      <Section
        title="Évolutions prévues"
        description="L'architecture applicative est préparée pour ces extensions."
      >
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Intégration PVGIS",
            "Sélection du site par carte / GPS",
            "Simulation au pas horaire",
            "Import de profils de charge",
            "Ombrage avancé",
            "Optimisation du stockage",
            "Bornes de recharge",
            "Structures tarifaires multiples",
            "Export DXF / schéma unifilaire",
            "Dimensionnement des câbles et chutes de tension",
            "Contrôles de conception selon la CEI",
            "Multilingue français / anglais / arabe",
            "Comptes utilisateurs et espaces d'équipe",
            "Rapports en marque blanche",
          ].map((item) => (
            <div key={item} className="rounded-sm border border-border bg-card px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Responsabilité">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les résultats produits sont des estimations préliminaires. La conception
          définitive, le choix des équipements, la vérification structurelle, les
          protections électriques et la conformité au raccordement relèvent d'un
          professionnel qualifié.
        </p>
        <Link
          to="/contact"
          className="mt-5 inline-flex rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Nous contacter
        </Link>
      </Section>
    </div>
  );
}
