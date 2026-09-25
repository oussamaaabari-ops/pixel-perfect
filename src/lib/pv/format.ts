import type { Currency } from "./types";

export const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export const MONTHS_FR_LONG = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function money(value: number, currency: Currency, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${num(value, digits)} ${currency}`;
}

export function pct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${num(value, digits)} %`;
}
