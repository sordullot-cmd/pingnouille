import { TS } from "./type";

/**
 * Métriques des boutons — SOURCE UNIQUE des hauteurs, marges internes et
 * tailles de texte d'un bouton.
 *
 * L'audit du 20/08/2026 : 607 `<button>` écrits à la main contre 32
 * `PillButton`, et vingt-cinq combinaisons de marges internes différentes
 * (`10px 12px`, `8px 10px`, `7px 14px`, `9px 18px`…). Deux boutons côte à côte
 * dans la même barre d'outils n'avaient donc pas la même hauteur, et rien ne
 * disait laquelle était la bonne.
 *
 * ── UNE seule métrique ────────────────────────────────────────────────────
 * Tous les boutons font **44 px de corps**, **4 px d'arête basse** et **16 px
 * de marge de chaque côté du texte**. Les trois paliers d'avant se
 * distinguaient par leur hauteur puis par leur respiration : dans les deux cas
 * la nuance était lisible ici, pas à l'écran, où elle ne produisait qu'un
 * bouton plus court ou plus serré que son voisin sans qu'on sache pourquoi.
 *
 * D'où viennent les nombres :
 *
 * - **44** est relevé sur la référence (CTA de 88 px de corps sur une capture
 *   de 758, échelle 2 px/pt) ET c'est le seuil de cible tactile. Le 34 d'avant
 *   était sous ce seuil : au doigt, un bouton sur deux se ratait.
 * - **4** d'arête est relevé au même endroit (8 px sur la même capture), soit
 *   9,1 % du corps. C'est un NOMBRE, pas une chaîne de `box-shadow` : la
 *   couleur de l'arête dépend de la variante — Whale sous un bouton Macaw,
 *   Tree Frog sous un bouton Owl —, et seul le composant connaît sa variante.
 *   Lui laisser composer `0 ${BTN.md.arete}px 0 ${T.areteAction}` garde la
 *   métrique ici et la peau là-bas, comme le reste de ce fichier.
 * - **12** de rayon est relevé (42 px sur 173 de haut, 24,3 %). La pilule
 *   n'est PLUS la forme de bouton : elle ne reste qu'aux badges, aux pastilles
 *   de statut et à la barre de progression.
 * - **16** de marge horizontale est le cran de la gouttière d'écran, ce qui
 *   aligne le texte d'un bouton pleine largeur sur la marge de la page. Le
 *   **12** vertical est ce qui reste pour tomber sur 44 sans le forcer :
 *   12 + (14 × 1,4) + 12 = 43,6. Aucune des deux valeurs n'est hors de
 *   l'échelle d'espacement — c'est la contrainte qui les a choisies.
 *
 * Les clés `sm` / `md` / `lg` survivent pour ne pas casser leurs appels ; elles
 * rendent la même métrique. Seul `lg` garde son texte d'un cran au-dessus, pour
 * l'action qui conclut une modale.
 *
 * `minHeight` autant que le padding : sans lui, deux boutons voisins dont l'un
 * porte une icône et l'autre non ne font pas la même hauteur, parce que la
 * hauteur de ligne du texte diffère de celle du glyphe.
 *
 * ── Ce que ce fichier ne dit PAS ──────────────────────────────────────────
 * Ni couleur, ni bordure, ni ombre : la PEAU d'un bouton (primaire, discret,
 * danger, fantôme) reste au composant qui le rend — cf. `PillButton` dans
 * `components/ui/form.jsx`. On unifie la métrique, pas l'apparence : un
 * bouton de suppression doit continuer de se distinguer d'un bouton de
 * validation.
 *
 * ── Comment s'en servir ───────────────────────────────────────────────────
 * ```jsx
 * <button style={{ ...BTN.md, background: T.text, color: T.textInverted }}>
 *   Enregistrer
 * </button>
 * ```
 */

/** Une taille de bouton, prête à étaler dans un style inline. */
export interface ButtonMetrics {
  minHeight: number;
  padding: string;
  borderRadius: number;
  fontSize: number;
  fontWeight: number;
  gap: number;
  /** Épaisseur de l'arête basse, en pixels. Voir l'en-tête : c'est le composant
   *  qui en compose le `box-shadow`, avec la couleur de SA variante. */
  arete: number;
}

/* Le rayon est 12 partout : un rayon qui change avec la taille ferait trois
   formes au lieu d'une. */
const FORME = { borderRadius: 12, fontWeight: 600 } as const;

/** Le corps, commun à tous les boutons. Un bouton du site fait ça, point. */
export const BTN_HEIGHT = 44;
/** L'arête basse, commune elle aussi. */
export const BTN_ARETE = 4;
/** La marge interne : 12 px au-dessus et au-dessous, 16 de chaque côté. */
export const BTN_PADDING = "12px 16px";

export const BTN: Record<"sm" | "md" | "lg", ButtonMetrics> = {
  /** Ligne de tableau, barre d'outils dense. */
  sm: { ...FORME, minHeight: BTN_HEIGHT, padding: BTN_PADDING, fontSize: TS.body,    gap: 8, arete: BTN_ARETE },
  /** Le défaut. Celui qu'on prend sans réfléchir. */
  md: { ...FORME, minHeight: BTN_HEIGHT, padding: BTN_PADDING, fontSize: TS.body,    gap: 8, arete: BTN_ARETE },
  /** L'action qui conclut un formulaire ou une modale — seul son texte diffère. */
  lg: { ...FORME, minHeight: BTN_HEIGHT, padding: BTN_PADDING, fontSize: TS.callout, gap: 8, arete: BTN_ARETE },
};

/**
 * Bouton d'icône seule : un carré, donc une largeur ÉGALE à la hauteur de la
 * taille correspondante. Sans cette table, un bouton d'icône se retrouve plus
 * étroit ou plus large que le bouton texte d'à côté et la barre d'outils
 * ondule.
 *
 * Rayon 12 et non 50 % : un bouton d'icône rond posé à côté d'un bouton de
 * texte à rayon 12 fait deux formes dans la même barre. Arête 4 comme tous les
 * autres — le relevé de 8 cité par la DA vient d'un bouton de micro de 40 de
 * côté, qui est un objet plein écran, pas un bouton de barre d'outils.
 */
export const BTN_ICON: Record<"sm" | "md" | "lg", { width: number; height: number; borderRadius: number; arete: number }> = {
  sm: { width: BTN_HEIGHT, height: BTN_HEIGHT, borderRadius: FORME.borderRadius, arete: BTN_ARETE },
  md: { width: BTN_HEIGHT, height: BTN_HEIGHT, borderRadius: FORME.borderRadius, arete: BTN_ARETE },
  lg: { width: BTN_HEIGHT, height: BTN_HEIGHT, borderRadius: FORME.borderRadius, arete: BTN_ARETE },
};
