"use client";

/* ============================================================================
   Champs, formulaires et modales — briques de la nouvelle direction artistique.

   La référence est la modale « Nouvelle séance » (SessionForm, SportPage) :
   c'est elle qui fixe le langage, tout le reste s'aligne dessus.

   Ce que dit cette référence, et qui ne va pas de soi :

   • La modale est une FENÊTRE, pas un écran de blocage. Voile transparent —
     aucun assombrissement —, ombre de couche flottante pour tout détachement,
     et on l'attrape par son en-tête pour la déplacer où l'on veut. On garde
     donc sous les yeux le contexte qu'on est en train de modifier.
   • L'en-tête ne porte PAS de titre. Une poignée centrée, les actions d'icône
     à droite, rien d'autre. Le titre était une ligne de chrome de plus à lire
     avant d'arriver au formulaire — le bouton qui a ouvert la fenêtre a déjà
     dit ce qu'elle fait.
   • Un champ est un CREUX : aplat `surfaceCreuse`, bordure de 2, rayon 8,
     hauteur 44. Pas d'arête — un champ se creuse, il ne se pose pas.
   • Un bouton est l'inverse : un objet POSÉ, donc un aplat plein et une arête
     basse solide de 4 px d'un ton plus foncé de sa propre famille. Rayon 12.

   ── Ce que ce fichier disait avant, et pourquoi il ne le dit plus ─────────
   La version précédente faisait du champ une PILULE en aplat sans contour, et
   du bouton une pilule pleine « jamais de contour », en argumentant que dix
   contours font dix rectangles à lire. L'argument valait contre un cadre gris
   de 1 px posé sur un fond gris ; il ne tient plus, parce que le fond de page
   est maintenant BLANC (cf. `components/DashboardNew`). Sur du blanc, un aplat
   sans contour ne se voit pas — c'est précisément ce que la bordure de 2 et
   l'arête sont là pour résoudre, et c'est la mécanique entière de la DA.

   La pilule ne disparaît pas pour autant : elle reste la forme des badges, des
   pastilles de statut et de la barre de progression. Elle n'est simplement
   plus la forme d'un bouton ni celle d'un champ.
   ========================================================================== */

import React from "react";
import ReactDOM from "react-dom";
import { Check, X } from "lucide-react";
import { T, FIELD_BG, WRITING_BG, HAIRLINE } from "@/lib/ui/tokens";
import { BTN, BTN_ICON } from "@/lib/ui/buttons";
import { TYPE, TS, CAPS } from "@/lib/ui/type";
import { luminance } from "@/lib/ui/color";
import { hasFinePointer } from "@/lib/ui/pointer";
import { backdropDismiss } from "@/lib/hooks/useBackdropDismiss";
import { useModalExit } from "@/lib/hooks/useModalExit";
import { useScrollEdges, scrollEdgeShadow } from "@/lib/hooks/useScrollEdges";

/* ── Contrôles ───────────────────────────────────────────────────────────── */

/**
 * Champ de saisie sur une ligne : un CREUX cerné.
 *
 * Aplat `surfaceCreuse` (Polar, le remplissage de champ de la référence),
 * bordure de 2, rayon 8, hauteur 44 — la même que le bouton, pour qu'un champ
 * et le bouton posé à côté de lui s'alignent. Aucune arête : l'arête dit
 * « posé », et un champ est le contraire d'un objet posé.
 *
 * `minWidth: 0` et `boxSizing` sont là pour de bonnes raisons : sans le
 * premier, un champ dans une grille refuse de descendre sous sa largeur
 * intrinsèque et fait déborder la ligne ; sans le second, le padding s'ajoute
 * au `width: 100%` — et depuis que la bordure fait 2 px de chaque côté, il
 * s'ajouterait 4 px de plus.
 */
/** @type {import("react").CSSProperties} */
export const FIELD = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  minHeight: 44,
  padding: "0 12px",
  borderRadius: "var(--radius-field)",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: T.border,
  backgroundColor: T.surfaceCreuse,
  color: T.text,
  ...TYPE.body,
  fontFamily: "inherit",
  outline: "none",
};

/**
 * Zone d'écriture. Aplat plus dilué que le champ d'une ligne : la même valeur
 * de gris, étalée sur cent pixels de haut, ne se lit plus comme un creux mais
 * comme un pavé. Le padding revient au format haut/bas puisqu'il y a plusieurs
 * lignes à cadrer.
 */
/** @type {import("react").CSSProperties} */
export const FIELD_AREA = {
  ...FIELD,
  backgroundColor: WRITING_BG,
  minHeight: 92,
  padding: "10px 12px",
  lineHeight: 1.45,
  resize: "vertical",
};

/** Variante compacte, pour les lignes de tableau et les barres d'outils.
 *  Elle descend sous 44 : ce n'est pas une cible tactile isolée mais un champ
 *  posé dans une grille déjà dense, où la ligne entière fait la cible. */
/** @type {import("react").CSSProperties} */
export const FIELD_SM = { ...FIELD, minHeight: 34, padding: "0 10px", fontSize: TS.label };

/**
 * Anneau de focus. Posé en `box-shadow` pour ne pas déplacer la mise en page
 * d'un pixel à la prise de focus — un `outline` pousserait ses voisins.
 */
export const FIELD_FOCUS_RING =
  "0 0 0 2px color-mix(in srgb, var(--accent) 45%, transparent)";

/**
 * Au focus, le champ CESSE d'être un creux : sa bordure prend la couleur
 * d'action et son fond passe au blanc de la surface. C'est ce qui distingue
 * « ça écrit ici » de « il y a un champ ici », maintenant que le champ porte
 * déjà un contour au repos.
 */
function focusHandlers(onFocus, onBlur) {
  return {
    onFocus: (e) => {
      const el = e.currentTarget;
      /* Valeurs RÉELLES de départ, pas celles de `FIELD` : un champ à qui
         l'appelant passe sa propre bordure ou son propre fond (une zone
         d'écriture, un champ en erreur) les perdrait au premier focus. */
      el.dataset.restBorder = el.style.borderColor;
      el.dataset.restBg = el.style.backgroundColor;
      el.style.boxShadow = FIELD_FOCUS_RING;
      el.style.borderColor = T.action;
      el.style.backgroundColor = T.white;
      onFocus?.(e);
    },
    onBlur: (e) => {
      const el = e.currentTarget;
      el.style.boxShadow = "none";
      el.style.borderColor = el.dataset.restBorder || T.border;
      el.style.backgroundColor = el.dataset.restBg || T.surfaceCreuse;
      onBlur?.(e);
    },
  };
}

/** @param {{ style?: import("react").CSSProperties, onFocus?: Function, onBlur?: Function, compact?: boolean } & Record<string, any>} props */
export function Input({ style = undefined, onFocus = undefined, onBlur = undefined, compact = false, ...rest }) {
  return (
    <input
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...(compact ? FIELD_SM : FIELD), ...style }}
      {...rest}
    />
  );
}

/**
 * Zone de saisie multiligne.
 *
 * Elle transmet sa `ref` : certaines saisies ont besoin de l'élément lui-même,
 * pas seulement de sa valeur — poser un trou autour de la sélection courante
 * (éditeur de cartes), replacer le curseur après une insertion. Sans
 * transmission, ces gestes obligeraient à redéfinir un champ en local, ce que la
 * charte interdit.
 */
/** @param {{ style?: import("react").CSSProperties, onFocus?: Function, onBlur?: Function } & Record<string, any>} props */
export const Textarea = React.forwardRef(function Textarea(
  { style = undefined, onFocus = undefined, onBlur = undefined, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...FIELD_AREA, ...style }}
      {...rest}
    />
  );
});

/** @param {{ style?: import("react").CSSProperties, onFocus?: Function, onBlur?: Function, children?: import("react").ReactNode } & Record<string, any>} props */
export function Select({ style = undefined, onFocus = undefined, onBlur = undefined, children = undefined, ...rest }) {
  return (
    <select
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...FIELD, cursor: "pointer", ...style }}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ── Boutons ─────────────────────────────────────────────────────────────── */

/**
 * Les cinq peaux de bouton : un aplat, une encre, une arête.
 *
 * Chaque variante colorée porte l'arête de SA famille — Whale sous Macaw, Tree
 * Frog sous Owl, Fire Ant sous Cardinal. C'est ce qui donne l'épaisseur
 * physique ; une arête grise sous un bouton bleu ferait une ombre, pas un
 * objet.
 *
 * L'encre posée dessus est `encreSurCouleur` (#0D0D0D) et non du blanc : blanc
 * sur Owl rend 2,09:1, sur Macaw 2,44:1, sur Cardinal 3,30:1 — aucun ne passe.
 * C'est un écart délibéré avec la référence, imposé par le contraste, et il
 * reste dans la charte (l'encre rend 9,30:1 sur Owl).
 *
 * `secondary` prend `border2` (#D4D4D4) en arête et non `border` (#E5E5E5) :
 * un bouton blanc dont l'arête a la couleur de sa bordure ne montre aucune
 * épaisseur — l'arête se confond avec le bord. Un cran en dessous suffit.
 *
 * `success` est DISPONIBLE, pas à répandre : elle ne sert que là où l'action
 * conclut une progression. Partout ailleurs le CTA est `primary`.
 */
const SKINS = {
  primary:   { background: T.action, color: T.encreSurCouleur, arete: T.areteAction, caps: true },
  success:   { background: T.green,  color: T.encreSurCouleur, arete: T.areteSucces, caps: true },
  secondary: { background: T.white,  color: T.text,  arete: T.border2, border: T.border },
  ghost:     { background: "transparent", color: T.textSub, arete: null },
  danger:    { background: T.red,    color: T.encreSurCouleur, arete: T.areteAlerte },
};

/**
 * Bouton d'action : un objet POSÉ sur son arête basse.
 *
 * Un bouton désactivé retombe sur le creux plutôt que de se contenter d'une
 * opacité : un bouton primaire à 50 % reste plus visible que les actions
 * réellement disponibles autour de lui. Il perd aussi son arête — un objet
 * qu'on ne peut pas enfoncer ne doit pas avoir l'air enfonçable.
 *
 * `data-arete` et `--arete-y` sont lus par globals.css, qui joue l'appui :
 * l'arête tombe à 0 et le bouton descend d'autant. L'enfoncement se joue sur
 * l'arête, jamais sur une mise à l'échelle.
 */
/** @param {{ variant?: string, disabled?: boolean, compact?: boolean, style?: import("react").CSSProperties, children?: import("react").ReactNode } & Record<string, any>} props */
export function PillButton({
  variant = "secondary",
  disabled = false,
  compact = false,
  style = undefined,
  children = undefined,
  onMouseEnter = undefined,
  onMouseLeave = undefined,
  ...rest
}) {
  const skin = SKINS[variant] || SKINS.secondary;
  const metrics = compact ? BTN.sm : BTN.md;
  const off = disabled
    ? { background: variant === "ghost" ? "transparent" : T.surfaceCreuse, color: T.textOff, arete: null }
    : skin;
  return (
    <button
      disabled={disabled}
      data-arete={off.arete ? "" : undefined}
      /* Métriques : BTN (lib/ui/buttons.ts), jamais des nombres écrits ici.
         `compact` = le palier `sm`, qui rend la même métrique : sans hauteur
         minimale, un bouton compact portant une icône était plus haut que son
         voisin qui n'en porte pas. */
      style={{
        minHeight: metrics.minHeight,
        padding: metrics.padding,
        borderRadius: metrics.borderRadius,
        borderWidth: off.border ? 2 : 0,
        borderStyle: "solid",
        borderColor: off.border || "transparent",
        fontSize: metrics.fontSize,
        fontWeight: skin.caps && !disabled ? 700 : metrics.fontWeight,
        ...(skin.caps && !disabled ? CAPS : null),
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: metrics.gap,
        whiteSpace: "nowrap",
        transition: "var(--tr-ui)",
        background: off.background,
        color: off.color,
        boxShadow: off.arete ? `0 ${metrics.arete}px 0 ${off.arete}` : "none",
        "--arete-y": `${metrics.arete}px`,
        ...style,
      }}
      /* Survol : l'aplat se mélange à 8 % vers SA couleur d'arête — la teinte
         reste la sienne, elle se pose juste d'un cran. L'arête, elle, ne bouge
         pas : c'est l'appui qui la fait tomber, pas le survol. Pointeur fin
         seulement, comme partout : au doigt, le survol se déclenche à l'appui
         et ne se relâche jamais. */
      onMouseEnter={(e) => {
        if (!disabled && hasFinePointer()) {
          const el = e.currentTarget;
          el.dataset.restBg = el.style.background;
          el.style.background = off.arete
            ? `color-mix(in srgb, ${off.arete} 8%, ${off.background})`
            : T.surfaceCreuse;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = el.dataset.restBg || off.background;
        onMouseLeave?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Bouton d'icône de l'en-tête d'une modale (fermer, supprimer).
 *
 * Sans fond au repos : dans un en-tête qui ne porte rien d'autre, un aplat
 * permanent ferait de la fermeture l'élément le plus visible de la fenêtre.
 *
 * Carré de 44 et non disque de 28 : 28 est très en dessous du seuil de cible
 * tactile, et un rond posé à côté d'un bouton de texte à rayon 12 fait deux
 * formes dans la même barre. Il grandit l'en-tête, et c'est le prix à payer
 * pour que la fermeture soit atteignable au doigt.
 */
/** @param {{ tone?: string, style?: import("react").CSSProperties, children?: import("react").ReactNode } & Record<string, any>} props */
export function IconButton({ tone = "neutral", style = undefined, children = undefined, ...rest }) {
  const hover = tone === "danger"
    ? { bg: T.redBg, fg: T.red }
    : { bg: FIELD_BG, fg: T.text };
  return (
    <button
      type="button"
      style={{
        ...BTN_ICON.md, border: "none",
        background: "transparent", color: T.textSub, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "var(--tr-ui)", flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hover.bg; e.currentTarget.style.color = hover.fg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Case à cocher de l'app : carré au trait dilué au repos, aplat plein coché.
 *
 * Elle remplace `<input type="checkbox">` partout où la ligne entière est
 * cliquable : la case native ne suit ni le rayon ni l'encre de la DA, et son
 * `accentColor` ne dit rien du glyphe posé dessus.
 *
 * `color` attend de préférence un HEX — les principales de la charte sont
 * claires (Owl rend 2,09:1 sur blanc), une coche blanche y disparaîtrait. Le
 * glyphe est donc calculé à partir de la luminance de l'aplat, seuil 0,45,
 * comme les autres coches sur couleur de l'app. Une valeur non hexadécimale
 * (une `var()`) retombe sur l'encre claire, le repli le moins risqué.
 *
 * `partial` sert aux têtes de groupe dont seule une partie des lignes est
 * cochée : un tiret, pas une coche.
 */
/** @param {{ on?: boolean, partial?: boolean, color?: string, size?: number }} props */
export function CheckBox({ on = false, partial = false, color = T.text, size = 16 }) {
  const filled = on || partial;
  const glyph = luminance(color) > 0.45 ? T.text : T.onSolid;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "var(--radius-field)", flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1.5px solid ${filled ? color : HAIRLINE}`,
        background: filled ? color : "transparent",
        transition: "var(--tr-ui)",
      }}
    >
      {on && <Check size={size - 4} strokeWidth={3} color={glyph} />}
      {!on && partial && (
        <span style={{ width: size - 7, height: 1.5, borderRadius: 1, background: glyph }} />
      )}
    </span>
  );
}

/* ── Étiquetage ──────────────────────────────────────────────────────────── */

/**
 * Libellé d'un champ : 12 px atténué, jamais de capitales espacées.
 *
 * C'est le seul des trois libellés de 12 px de la DA qui reste en minuscules.
 * La casse capitale coiffe un en-tête de section ou une colonne de tableau —
 * une fois par groupe ; répétée sur les douze champs d'un formulaire, elle
 * crierait plus fort que les valeurs qu'elle annonce.
 *
 * Encre atténuée et non une opacité : à 50 %, l'encre rend 3,9:1 sur blanc,
 * sous le seuil que la DA impose à toute métadonnée.
 */
/** @param {{ children?: import("react").ReactNode, style?: import("react").CSSProperties }} props */
export function Label({ children, style = undefined }) {
  return (
    <div style={{ ...TYPE.label, color: T.textSub, ...style }}>
      {children}
    </div>
  );
}

/**
 * Champ étiqueté : libellé 12 px atténué au-dessus, contrôle en dessous.
 *
 * Le libellé est en minuscules atténuées et non en capitales espacées : les
 * capitales se lisent moins vite et, répétées sur douze champs, elles crient
 * plus fort que les valeurs qu'elles annoncent.
 */
/** @param {{ label?: import("react").ReactNode, hint?: import("react").ReactNode, error?: import("react").ReactNode, required?: boolean, children?: import("react").ReactNode, style?: import("react").CSSProperties }} props */
export function Field({ label, hint = undefined, error = undefined, required = false, children = undefined, style = undefined }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      {label && (
        <Label>
          {label}
          {required && <span style={{ color: T.red, marginLeft: 3 }} aria-hidden="true">*</span>}
        </Label>
      )}
      {children}
      {/* L'erreur remplace l'aide : afficher les deux ferait lire deux fois. */}
      {/* L'erreur est un TEXTE rouge sous le champ, jamais un aplat rouge
          portant du texte : sur Cardinal plein, le blanc ne rend que 3,30:1 et
          l'encre y perdrait le sens d'alerte. Le champ, lui, prend la bordure
          d'alerte — c'est là que se lit l'état. */}
      {error
        ? <div role="alert" style={{ ...TYPE.caption, color: T.red }}>{error}</div>
        : hint ? <div style={{ ...TYPE.caption, color: T.textMut }}>{hint}</div> : null}
    </div>
  );
}

/** Grille de champs : N colonnes en large, une seule dès que c'est étroit
 *  (le repli est dans globals.css, sur `.tr4de-field-grid`). */
/** @param {{ columns?: number, gap?: number, children?: import("react").ReactNode, style?: import("react").CSSProperties }} props */
export function FieldGrid({ columns = 2, gap = 14, children = undefined, style = undefined }) {
  return (
    <div
      className="tr4de-field-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Bloc groupé dans une modale (panneau de choix, encart d'options) : un aplat
 * arrondi, sans contour. C'est le seul niveau d'imbrication autorisé — au-delà,
 * on empile des cadres.
 */
export function FieldGroup({ children = undefined, style = undefined }) {
  return (
    <div style={{ background: T.surfaceCreuse, border: "none", borderRadius: "var(--radius-card)", padding: 12, ...style }}>
      {children}
    </div>
  );
}

/* ── Zone défilante ──────────────────────────────────────────────────────── */

/**
 * Zone qui défile, avec ses ombres de bord.
 *
 * Autonome exprès : elle porte sa propre ref et son propre hook. Les dialogues
 * écrits à la main vivent au milieu de composants de page de deux mille lignes,
 * où glisser un `useRef` au bon endroit est laborieux et fragile. Ici le
 * remplacement se fait sur place, une balise contre une balise.
 */
/** @param {{ style?: import("react").CSSProperties, className?: string, children?: import("react").ReactNode } & Record<string, any>} props */
export function ScrollArea({ style = undefined, className = undefined, children = undefined, ...rest }) {
  const ref = React.useRef(null);
  const edges = useScrollEdges(ref);
  return (
    <div
      ref={ref}
      className={["scroll-thin", className].filter(Boolean).join(" ")}
      style={{
        overflowY: "auto",
        minHeight: 0,
        boxShadow: scrollEdgeShadow(edges),
        transition: "box-shadow var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Modale ──────────────────────────────────────────────────────────────── */

/**
 * Déplacement de la fenêtre à la souris, par son en-tête.
 *
 * Souris seule, volontairement : sur un écran tactile la modale occupe déjà
 * presque toute la largeur — il n'y a nulle part où la déplacer — et le geste
 * entrerait en concurrence avec le défilement du formulaire.
 */
function useWindowDrag() {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef(null);

  const onMouseDown = React.useCallback((e) => {
    // Un clic sur une action de l'en-tête n'est pas une prise de fenêtre.
    if (e.target.closest("button")) return;
    e.preventDefault();
    setDragging(true);
    ref.current = { x: pos.x, y: pos.y, startX: e.clientX, startY: e.clientY };
    const onMove = (ev) => {
      const d = ref.current;
      if (!d) return;
      setPos({ x: d.x + (ev.clientX - d.startX), y: d.y + (ev.clientY - d.startY) });
    };
    const onUp = () => {
      ref.current = null;
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos.x, pos.y]);

  return { pos, dragging, onMouseDown };
}

/**
 * Modale de la DA — calquée sur « Nouvelle séance ».
 *
 * Structure : poignée + actions d'icône en haut, corps défilant, pied
 * d'actions en pilules. Aucun titre dans le chrome.
 *
 * @param title     lu par les lecteurs d'écran uniquement, jamais affiché — le
 *                  chrome n'a pas de barre de titre, mais un dialogue sans nom
 *                  accessible est inutilisable au lecteur d'écran.
 * @param draggable faux pour une fenêtre qui n'a nulle part où aller.
 * @param scrim     vrai pour assombrir le fond. Réservé aux décisions
 *                  irréversibles, où voir le contexte importe moins que
 *                  comprendre qu'on doit répondre.
 * @param onDelete  ajoute l'action de suppression à gauche de la fermeture.
 */
/** @param {{ open?: boolean, title?: string, onClose?: Function, onDelete?: Function, deleteLabel?: string, children?: import("react").ReactNode, footer?: import("react").ReactNode, width?: number, maxHeight?: string, draggable?: boolean, scrim?: boolean, style?: import("react").CSSProperties, bodyStyle?: import("react").CSSProperties }} props */
export function Modal({
  open = true,
  title = undefined,
  onClose = undefined,
  onDelete = undefined,
  deleteLabel = "Supprimer",
  children = undefined,
  footer = undefined,
  width = 560,
  maxHeight = "min(88vh, 820px)",
  draggable = true,
  scrim = false,
  bodyStyle = undefined,
}) {
  const { pos, dragging, onMouseDown } = useWindowDrag();
  const { closing, requestClose } = useModalExit(onClose, 160);

  // Échap ferme : la fenêtre n'a pas de barre de titre système pour le faire.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); requestClose(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!open || typeof document === "undefined") return null;

  const moved = pos.x !== 0 || pos.y !== 0;

  return ReactDOM.createPortal(
    <div
      {...backdropDismiss(requestClose)}
      className={closing ? "anim-backdrop-out" : "anim-backdrop"}
      data-scrim={scrim ? "" : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        /* Voile transparent : la modale est une fenêtre posée sur le travail en
           cours, pas un écran qui l'efface. L'extérieur reste cliquable pour
           fermer, mais on continue de voir ce qu'on modifie — ce qui est tout
           l'intérêt de pouvoir déplacer la fenêtre pour lire dessous. */
        background: scrim ? "rgba(13, 13, 13, 0.42)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        /* Une fois la fenêtre déplacée, plus d'animation : elle vit dans le même
           `transform` que la position, et l'animation l'écraserait — la fenêtre
           sauterait au centre le temps de jouer. */
        className={`tr4de-modal-card ${moved ? "" : (closing ? "anim-modal-out" : "anim-modal")}`}
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight,
          display: "flex", flexDirection: "column",
          background: T.white,
          border: "none",
          borderRadius: "var(--radius-modal)",
          boxShadow: "var(--elev-overlay)",
          overflow: "hidden",
          transform: moved ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
        }}
      >
        {/* En-tête : une poignée, des actions. Pas de titre. */}
        <div
          onMouseDown={draggable ? onMouseDown : undefined}
          style={{
            position: "relative",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 10,
            cursor: draggable ? "move" : "default",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          {draggable && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute", left: "50%", top: 7, transform: "translateX(-50%)",
                width: 40, height: 4, borderRadius: 999,
                background: dragging ? T.textSub : T.border,
                transition: "background-color 120ms ease",
              }}
            />
          )}
          {onDelete && (
            <IconButton
              tone="danger"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onDelete}
              aria-label={deleteLabel}
              title={deleteLabel}
              style={{ marginLeft: "auto" }}
            >
              <TrashGlyph />
            </IconButton>
          )}
          {onClose && (
            <IconButton
              onMouseDown={(e) => e.stopPropagation()}
              onClick={requestClose}
              aria-label="Fermer"
              style={{ marginLeft: onDelete ? 0 : "auto" }}
            >
              <X size={16} strokeWidth={1.9} />
            </IconButton>
          )}
        </div>

        {/* Corps. `minHeight: 0` (via ScrollArea) : sans lui, un enfant flex
            refuse de descendre sous sa hauteur de contenu — et c'est la modale
            entière qui déborde au lieu que son corps défile. */}
        <ScrollArea style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 14, ...bodyStyle }}>
          {children}
        </ScrollArea>

        {footer && (
          <div style={{
            flexShrink: 0,
            padding: "12px 18px",
            /* Le seul filet de la fenêtre, et il est dilué : le pied porte des
               actions engageantes, il doit se détacher du contenu qu'on vient
               de remplir. Partout ailleurs, l'espace suffit. */
            borderTop: `1px solid ${HAIRLINE}`,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 8, flexWrap: "wrap",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* Corbeille dessinée à la main : importer `Trash2` ici obligerait toutes les
   pages qui n'affichent jamais l'action de suppression à embarquer l'icône. */
function TrashGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
