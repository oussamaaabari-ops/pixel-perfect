import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/pv/primitives";
import { GENERIC_MONTHLY_IRRADIATION_SHARE } from "@/lib/pv/calc";
import { MONTHS_FR } from "@/lib/pv/format";

export const Route = createFileRoute("/methodologie")({
  head: () => ({
    meta: [
      { title: "Méthodologie de calcul — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Formules et hypothèses utilisées : dimensionnement PV, tension de chaîne corrigée en température, production, ratio de performance, autoconsommation et calculs financiers.",
      },
      { property: "og:title", content: "Méthodologie de calcul — SOLARA ENGINEERING" },
      {
        property: "og:description",
        content: "Formules, hypothèses et limites du moteur de pré-dimensionnement photovoltaïque.",
      },
    ],
  }),
  component: Methodologie,
});

function Formula({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-sm border border-border bg-surface px-4 py-3 font-mono text-[12px] text-foreground">
      {children}
    </pre>
  );
}

function Methodologie() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-14">
      <header>
        <p className="label-technical">Documentation technique</p>
        <h1 className="mt-3 text-3xl font-bold">Méthodologie de calcul</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Les modèles présentés ci-dessous sont des modèles de pré-dimensionnement. Ils ne
          remplacent ni une simulation énergétique au pas horaire, ni une note de calcul
          électrique, ni une vérification structurelle.
        </p>
      </header>

      <Section title="1. Dimensionnement du générateur PV">
        <p className="text-sm text-muted-foreground">
          La puissance crête installée découle du nombre de modules et de leur puissance
          nominale aux conditions STC.
        </p>
        <Formula>{`P_PV [kWc] = N_modules × P_module [W] / 1000
N_modules = N_modules_par_chaîne × N_chaînes`}</Formula>
        <p className="mt-4 text-sm text-muted-foreground">
          La capacité géométrique (nombre de modules pouvant physiquement être installés)
          est distincte de la capacité électrique (configuration onduleur/chaînes) :
        </p>
        <Formula>{`Surface exploitable = Surface disponible × Coefficient d'exploitation
N_max_géométrique = ⌊ Surface exploitable / (L_module × l_module) ⌋`}</Formula>
      </Section>

      <Section title="2. Dimensionnement de l'onduleur et ratio DC/AC">
        <Formula>{`Ratio DC/AC = P_PV [kWc] / P_AC_onduleur [kW]`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune valeur universelle n'est imposée. Une plage indicative de 0,90 à 1,40 est
          utilisée pour l'affichage des avertissements ; le ratio approprié dépend du
          climat, de l'orientation, de la stratégie d'écrêtage, des caractéristiques de
          l'onduleur et des objectifs du projet.
        </p>
      </Section>

      <Section title="3. Tension de chaîne et correction en température">
        <p className="text-sm text-muted-foreground">
          La tension à vide est corrigée à la température minimale du site, la tension de
          fonctionnement à la température maximale de cellule.
        </p>
        <Formula>{`U_oc(T_min) = N_série × Voc_STC × [ 1 + (β_Voc / 100) × (T_min − 25) ]
U_mp(T_max) = N_série × Vmp_STC × [ 1 + (β_Voc / 100) × (T_max − 25) ]
I_MPPT = I_mp × N_chaînes_par_MPPT`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Contrôles appliqués : U_oc(T_min) ≤ U_DC_max onduleur ; U_mp dans la plage MPPT ;
          I_MPPT ≤ courant d'entrée maximal par MPPT ; nombre de chaînes ≤ MPPT × chaînes
          par MPPT.
        </p>
      </Section>

      <Section title="4. Production énergétique et ratio de performance">
        <Formula>{`Y_r [h] = H_POA [kWh/m²/an] / G_STC [1 kW/m²]
Facteur de pertes = Π (1 − perte_i)
Rendement spécifique [kWh/kWc/an] = Y_r × Facteur de pertes
E_PV [kWh/an] = P_PV [kWc] × Rendement spécifique
PR = Rendement spécifique / Y_r`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Les pertes prises en compte : température, salissure, désadaptation, câblage DC,
          câblage AC, onduleur, disponibilité, ombrage, autres. Lorsque le rendement
          spécifique est saisi directement, le PR n'est calculé que si une irradiation dans
          le plan des modules est également fournie.
        </p>
      </Section>

      <Section
        title="5. Répartition mensuelle"
        description="Hypothèse de forme, et non une donnée météorologique mesurée."
      >
        <p className="text-sm text-muted-foreground">
          En l'absence d'une base de données d'irradiation connectée (PVGIS, Meteonorm,
          Solargis), la production annuelle est répartie selon un profil générique de
          latitudes moyennes de l'hémisphère nord :
        </p>
        <div className="mt-4 grid grid-cols-6 gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-12">
          {GENERIC_MONTHLY_IRRADIATION_SHARE.map((s, i) => (
            <div key={i} className="bg-card px-2 py-2 text-center">
              <p className="font-mono text-[10px] text-muted-foreground">{MONTHS_FR[i]}</p>
              <p className="numeric text-[12px] font-medium">{(s * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="6. Autoconsommation et échanges réseau">
        <p className="text-sm text-muted-foreground">
          Bilan mensuel simplifié. Un facteur de simultanéité représente la part de la
          production directement consommée sur site (0,35 résidentiel ; 0,55 agricole ;
          0,65 tertiaire et industriel). Le stockage déplace ensuite une partie du surplus,
          dans la limite de sa capacité utile et de son rendement aller-retour.
        </p>
        <Formula>{`Autoconsommation directe = min(Consommation, Production × facteur de simultanéité)
Énergie stockée = min(Surplus, Besoin résiduel, C_utile × jours × η_AR)
Injection = Production − Autoconsommation directe − Énergie stockée
Soutirage = Consommation − Autoconsommation totale
Taux d'autoconsommation = Autoconsommation / Production
Taux d'autoproduction = Autoconsommation / Consommation`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Un bilan mensuel surestime généralement l'autoconsommation par rapport à une
          simulation au pas horaire. Ces valeurs sont des estimations.
        </p>
      </Section>

      <Section title="7. Stockage">
        <Formula>{`C_utile [kWh] = C_nominale × DoD
C_recommandée = (Consommation journalière moyenne × part hors production) / DoD
Autonomie [h] = (C_utile / Consommation journalière moyenne) × 24`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Un dimensionnement de batterie fiable exige un profil de charge détaillé.
        </p>
      </Section>

      <Section title="8. Analyse économique">
        <Formula>{`CAPEX = Σ (modules, onduleur, structure, protections, pose, ingénierie, batterie, divers)
Économie année n = [ E_auto × Tarif + E_injectée × Tarif_injection ]
                   × (1 − dégradation)^(n−1) × (1 + escalade tarifaire)^(n−1) − OPEX
Temps de retour simple = année où le cumul des flux devient positif
ROI = (Économies cumulées − CAPEX) / CAPEX`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune actualisation n'est appliquée (temps de retour simple). Ces résultats ne
          constituent pas une garantie de rentabilité.
        </p>
      </Section>

      <Section title="9. Analyse environnementale">
        <Formula>{`CO₂ évité [kg/an] = E_PV [kWh/an] × Facteur d'émission [kgCO₂/kWh]`}</Formula>
        <p className="mt-3 text-sm text-muted-foreground">
          Le facteur d'émission est saisi par l'utilisateur ; sa source doit être précisée.
        </p>
      </Section>
    </div>
  );
}
