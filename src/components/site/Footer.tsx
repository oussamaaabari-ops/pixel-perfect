import { Link } from "@tanstack/react-router";
import { BRAND, DISCLAIMER } from "@/lib/brand";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm text-muted-foreground">{BRAND.tagline}</p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            {DISCLAIMER}
          </p>
        </div>
        <div>
          <p className="label-technical">Plateforme</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/etude" className="hover:text-foreground">Pré-dimensionnement</Link></li>
            <li><Link to="/resultats" className="hover:text-foreground">Résultats</Link></li>
            <li><Link to="/projets" className="hover:text-foreground">Projets enregistrés</Link></li>
            <li><Link to="/equipements" className="hover:text-foreground">Bibliothèque d'équipements</Link></li>
          </ul>
        </div>
        <div>
          <p className="label-technical">Société</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/methodologie" className="hover:text-foreground">Méthodologie</Link></li>
            <li><Link to="/a-propos" className="hover:text-foreground">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">{BRAND.city}</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND.fullName}. Estimations préliminaires — usage non contractuel.
      </div>
    </footer>
  );
}
