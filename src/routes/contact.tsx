import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { SelectField, TextField } from "@/components/pv/fields";
import { Section } from "@/components/pv/primitives";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SOLARA ENGINEERING" },
      {
        name: "description",
        content:
          "Contactez SOLARA ENGINEERING pour une étude photovoltaïque, une validation d'ingénierie ou une intégration de la plateforme.",
      },
      { property: "og:title", content: "Contact — SOLARA ENGINEERING" },
      {
        property: "og:description",
        content: "Demande d'étude, validation d'ingénierie ou intégration de la plateforme.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("etude");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <header>
        <p className="label-technical">Contact</p>
        <h1 className="mt-3 text-3xl font-bold">Parlons de votre projet</h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Étude de pré-dimensionnement, validation par un ingénieur, intégration de données
          d'équipements réelles ou déploiement en marque blanche.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Formulaire de demande">
          {sent ? (
            <div className="rounded-sm border border-success/30 bg-success/5 px-4 py-6 text-sm">
              <p className="font-semibold text-foreground">Message préparé</p>
              <p className="mt-1 text-muted-foreground">
                L'envoi automatique n'est pas encore raccordé. Copiez votre message et
                adressez-le à {BRAND.email}, ou demandez l'activation de l'envoi d'e-mails.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 rounded-sm border border-border px-4 py-2 text-[13px] font-medium"
              >
                Modifier le message
              </button>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <TextField label="Nom et prénom" value={name} onChange={setName} />
              <TextField label="Adresse e-mail" value={email} onChange={setEmail} />
              <div className="sm:col-span-2">
                <SelectField
                  label="Objet"
                  value={subject}
                  onChange={setSubject}
                  options={[
                    { value: "etude", label: "Demande d'étude de pré-dimensionnement" },
                    { value: "validation", label: "Validation par un ingénieur" },
                    { value: "equipements", label: "Intégration de données d'équipements" },
                    { value: "autre", label: "Autre demande" },
                  ]}
                />
              </div>
              <label className="block sm:col-span-2">
                <span className="text-[13px] font-medium">Message</span>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder="Type de projet, localisation, consommation annuelle, contraintes de site…"
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-sm bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  Envoyer la demande
                </button>
              </div>
            </form>
          )}
        </Section>

        <Section title="Coordonnées">
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 text-accent" />
              <span className="text-muted-foreground">{BRAND.email}</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 text-accent" />
              <span className="text-muted-foreground">{BRAND.phone}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-accent" />
              <span className="text-muted-foreground">{BRAND.city}</span>
            </li>
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Ces coordonnées sont des valeurs de démonstration à remplacer par celles de
            votre structure.
          </p>
        </Section>
      </div>
    </div>
  );
}
