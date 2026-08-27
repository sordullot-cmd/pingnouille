/**
 * Accent de marque réglable (Réglages → Apparence).
 *
 * Deux teintes seulement :
 *   - principale  → `--accent`   : item de nav actif, pastilles, éléments actifs
 *   - secondaire  → `--accent-2` : courbe de portefeuille, séries de graphiques
 *
 * Les dérivés (`--accent-soft`, `--accent-tint`) sont calculés en `color-mix`
 * dans app/globals.css : rien d'autre à écrire quand la teinte change.
 *
 * Application : style inline sur <html>, qui prime sur les valeurs par défaut
 * du CSS. Persistance en localStorage, relue avant l'hydratation par le script
 * `tr4de-accent-init` de app/layout.tsx (évite le flash de l'ancienne couleur).
 */

import { readableInk } from "./color";

export const ACCENT_KEY = "tr4de_accent";
export const ACCENT_2_KEY = "tr4de_accent_2";

export type AccentPreset = {
  id: string;
  label: string;
  /** Couleur principale (`--accent`). */
  primary: string;
  /** Couleur secondaire (`--accent-2`). */
  secondary: string;
};

/**
 * Valeurs livrées par défaut : Macaw #1CB0F6 et son cran foncé Whale #1899D6.
 *
 * Le vert #64D741 / #4CC72C d'avant était la SEULE couleur de l'app qui ne
 * vienne pas de la charte — un essai, comme le disait son commentaire. Il reste
 * comme préréglage nommé, au même titre que le violet d'origine : un accent
 * déjà choisi par un utilisateur est enregistré en localStorage et n'est pas
 * touché ; seul le défaut change.
 *
 * Macaw plutôt qu'un vert, aussi, parce que le vert a maintenant un emploi
 * précis : il dit le SUCCÈS. Sur les écrans de la référence, le bleu couvre
 * presque quatre fois la surface du vert de marque.
 */
export const DEFAULT_ACCENT = "#1CB0F6";
export const DEFAULT_ACCENT_2 = "#1899D6";

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "macaw",  label: "Bleu (Macaw)",      primary: DEFAULT_ACCENT, secondary: DEFAULT_ACCENT_2 },
  // Le vert servi par défaut jusqu'ici : hors charte, gardé comme préréglage.
  { id: "green",  label: "Vert (d'essai)",    primary: "#64D741", secondary: "#4CC72C" },
  // Accent d'origine de la maquette Figma, conservé tel quel.
  { id: "violet", label: "Violet (d'origine)", primary: "#9C7BFF", secondary: "#7C4DFF" },
  { id: "blue",   label: "Bleu vif",          primary: "#3B82F6", secondary: "#2563EB" },
  { id: "amber",  label: "Ambre",             primary: "#F59E0B", secondary: "#EA8C00" },
  // Charbon en principale, doré en secondaire : les éléments actifs restent
  // sobres, la couleur ne parle que dans les courbes et les séries.
  { id: "charcoal", label: "Charbon & or",    primary: "#232323", secondary: "#FEC76C" },
];

/** `#abc` / `#aabbcc` uniquement : on n'injecte pas une valeur arbitraire dans le DOM. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

/** Teintes enregistrées, avec repli sur les valeurs par défaut. */
export function readAccent(): { primary: string; secondary: string } {
  if (typeof window === "undefined") return { primary: DEFAULT_ACCENT, secondary: DEFAULT_ACCENT_2 };
  let primary = DEFAULT_ACCENT;
  let secondary = DEFAULT_ACCENT_2;
  try {
    const p = localStorage.getItem(ACCENT_KEY);
    const s = localStorage.getItem(ACCENT_2_KEY);
    if (p && isHexColor(p)) primary = p;
    if (s && isHexColor(s)) secondary = s;
  } catch {}
  return { primary, secondary };
}

/**
 * L'encre lisible sur un APLAT PLEIN de l'accent (pastille d'action, bouton
 * flottant).
 *
 * Elle ne peut pas être une variable CSS : choisir entre l'encre et le blanc
 * demande de comparer deux ratios de contraste, ce que CSS ne sait pas faire,
 * et l'accent est un réglage utilisateur — « Charbon & or » vaut #232323, sur
 * lequel l'encre rend 1,2:1, quand Macaw demande l'inverse. Une valeur figée se
 * tromperait donc sur un préréglage ou sur l'autre.
 *
 * Côté serveur, l'accent livré par défaut est la bonne réponse : c'est celui
 * que le premier rendu affiche de toute façon.
 */
export function accentInk(): string {
  return readableInk(readAccent().primary);
}

/** Applique les teintes à <html> et les enregistre. */
export function applyAccent(primary: string, secondary: string): void {
  if (typeof document === "undefined") return;
  if (!isHexColor(primary) || !isHexColor(secondary)) return;
  const root = document.documentElement;
  root.style.setProperty("--accent", primary);
  root.style.setProperty("--accent-2", secondary);
  try {
    localStorage.setItem(ACCENT_KEY, primary);
    localStorage.setItem(ACCENT_2_KEY, secondary);
  } catch {}
}
