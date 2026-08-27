"use client";

import React, { useEffect, useState } from "react";
import { CountUp } from "./CountUp";
import { T } from "@/lib/ui/tokens";
import { TYPE, TABULAR } from "@/lib/ui/type";

interface XpBarProps {
  /** Niveau courant. */
  level: number;
  /** Remplissage de la barre (0–100). */
  pct: number;
  /** XP dans le niveau courant / XP requis pour le suivant. */
  intoLevel: number;
  neededForNext: number;
  /**
   * `main` — la barre est l'objet central de l'écran : 16 px de haut, la
   * valeur relevée sur la référence.
   * `inline` (défaut) — la barre vit dans une ligne de liste ou une carte de
   * statistique : 6 px. Le relevé vient d'une barre qui traverse un écran de
   * téléphone entier ; l'appliquer ici ferait exploser la densité des listes.
   */
  size?: "inline" | "main";
  /** Couleurs. Par défaut la progression est un SUCCÈS, donc Owl sur Swan. */
  fillColor?: string;
  trackColor?: string;
  textColor?: string;
  mutedColor?: string;
  width?: number;
}

/**
 * Barre de niveau : un badge, une piste, un compteur.
 *
 * ── Une célébration, un élément, un moment ────────────────────────────────
 * Ce composant en jouait QUATRE en même temps sur un passage de niveau : le
 * badge qui « pope » (620 ms), la barre qui flashe (700 ms), six particules
 * qui jaillissent (700 ms) et un « +N XP » flottant (900 ms). Quatre durées
 * différentes, quatre courbes, sur trois éléments — c'est-à-dire du bruit là
 * où il fallait un accent. Il n'en reste qu'une, celle du passage de niveau,
 * retimée à `--dur-celebration` (570 ms, relevé sur la référence) avec
 * `--ease-spring`, qui a le profil mesuré : dépassement puis stabilisation.
 * Une seule propriété animée, l'échelle. Jamais un déplacement d'écran.
 *
 * La détection du changement suit le patron React « ajuster l'état pendant le
 * rendu » (comparaison à la valeur précédente stockée en state), ce qui évite
 * un `setState` synchrone dans un effet.
 *
 * Rayon 999 : la barre de progression est, avec les badges et les pastilles de
 * statut, l'un des rares endroits où la pilule survit — elle n'est plus la
 * forme des boutons. Aucune arête, aucun dégradé.
 */
export function XpBar({
  level, pct, intoLevel, neededForNext,
  size = "inline",
  fillColor = T.green,
  trackColor = T.border,
  textColor = T.text,
  mutedColor = T.textMut,
  width = 110,
}: XpBarProps) {
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  if (level !== prevLevel) {
    const up = level > prevLevel;
    setPrevLevel(level);
    if (up) {
      setCelebrateKey(k => k + 1);
      setCelebrating(true);
    }
  }

  // Fin de la célébration : la durée du token, plus une marge d'une frame.
  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 600);
    return () => window.clearTimeout(timer);
  }, [celebrating, celebrateKey]);

  const h = size === "main" ? 16 : 6;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
      {/* Badge « Nv X » — la seule célébration qui reste. */}
      <span
        key={`lvl-${celebrateKey}`}
        className={celebrating ? "anim-level-pop" : undefined}
        style={{
          ...TYPE.body, fontWeight: 700, color: textColor,
          whiteSpace: "nowrap", ...TABULAR,
          transformOrigin: "center",
          display: "inline-block",
        }}
      >
        Nv {level}
      </span>

      <div style={{ width, height: h, borderRadius: 999, background: trackColor, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`, height: "100%", background: fillColor,
            borderRadius: 999, transition: "width var(--dur-slow) var(--ease-out)",
          }}
        />
      </div>

      <span style={{ ...TYPE.caption, color: mutedColor, whiteSpace: "nowrap", ...TABULAR }}>
        <CountUp value={intoLevel} duration={450} /> / {neededForNext} XP
      </span>
    </div>
  );
}

export default XpBar;
