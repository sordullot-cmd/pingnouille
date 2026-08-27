"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { hasFinePointer } from "@/lib/ui/pointer";
import { T } from "@/lib/ui/tokens";
import { TYPE } from "@/lib/ui/type";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hoverable?: boolean;
  accent?: "default" | "primary" | "success" | "warning" | "danger" | "info";
}

export function Card({ padded = true, hoverable = false, accent = "default", style, children, onMouseEnter, onMouseLeave, ...rest }: CardProps) {
  /* Liseré de rôle. 4 px et non 3 : la grille de la DA est en multiples de 4,
     et `primary` prend la couleur d'ACTION là où elle posait un trait d'encre
     noire — dire « important » avec du noir n'est plus le langage de la DA. */
  const accentBorders: Record<string, string> = {
    default: "transparent",
    primary: T.action,
    success: T.green,
    warning: T.amber,
    danger: T.red,
    info: T.purple,
  };
  const accentColor = accentBorders[accent];

  return (
    <div
      data-arete=""
      style={{
        background: T.white,
        /* Longhands et non le raccourci `border` : il contient un `var()`, que
           le navigateur ne décompose pas — relire `style.borderColor` rendrait
           la chaîne vide, et la restaurer au relâchement effacerait la couleur.
           C'est le piège documenté plus bas, réglé à la source. */
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: T.border,
        borderRadius: "var(--radius-card)",
        /* 16 et non 20 : le cran de la gouttière d'écran, pour que le contenu
           d'une carte s'aligne sur la marge de la page. */
        padding: padded ? 16 : 0,
        boxShadow: T.areteCarte,
        ["--arete-y" as string]: "6px",
        transition:
          "border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out), transform 200ms var(--ease-out)",
        position: "relative",
        ...(accent !== "default" && { borderLeftWidth: 4, borderLeftColor: accentColor }),
        ...style,
      }}
      onMouseEnter={(e) => {
        /* Le soulèvement est réservé aux pointeurs précis : au doigt, le survol
           se déclenche à l'appui et ne se relâche jamais — la carte resterait
           levée. */
        /* Au survol, SEULE la bordure se soutient. L'arête ne change pas et la
           carte ne monte plus d'un pixel : un bloc à arête est POSÉ, il ne
           lévite pas — c'est justement ce que l'arête dit. L'enfoncement à
           l'appui, lui, est joué par globals.css sur `data-arete`. */
        if (hoverable && hasFinePointer()) {
          const el = e.currentTarget;
          /* On mémorise la valeur RÉELLE de départ au lieu de réécrire celle de
             la variante au relâchement : une carte à qui l'appelant passe
             `style={{ borderColor: … }}` perdait sa bordure au premier survol. */
          el.dataset.restBorder = el.style.borderColor || T.border;
          el.style.borderColor = T.border2;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          const el = e.currentTarget;
          el.style.borderColor = el.dataset.restBorder || T.border;
        }
        onMouseLeave?.(e);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function CardHeader({ title, subtitle, action, onClick, showChevron = false }: CardHeaderProps) {
  const titleNode = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ ...TYPE.headline, color: T.text }}>{title}</span>
      {showChevron && <ChevronRight size={16} strokeWidth={2} color={T.textMut} />}
    </span>
  );

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: subtitle ? 4 : 12 }}>
      <div>
        {onClick ? (
          <button
            onClick={onClick}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {titleNode}
          </button>
        ) : (
          titleNode
        )}
        {subtitle && <div style={{ ...TYPE.caption, color: T.textMut, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
