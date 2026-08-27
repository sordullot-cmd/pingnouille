"use client";

import React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";
import Button from "./Button";
import { T } from "@/lib/ui/tokens";
import { TS, TYPE } from "@/lib/ui/type";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  size?: "sm" | "md" | "lg";
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action, size = "md" }: EmptyStateProps) {
  /* Les trois tailles de la composition restent celles d'origine : la
     structure (un visuel, un titre court, une phrase, UN bouton) est déjà
     celle des écrans vides de la référence, et ses proportions tiennent.
     Seul le titre est ramené sur l'échelle — 18 n'était sur aucun cran. */
  const iconBox = size === "sm" ? 36 : size === "md" ? 44 : 56;
  const iconSize = size === "sm" ? 18 : size === "md" ? 22 : 28;
  const titleSize = size === "sm" ? TS.callout : TS.headline;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: size === "lg" ? "48px 32px" : "32px 24px",
      textAlign: "center",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Une icône agrandie dans un creux, jamais une illustration : la
          référence emploie des personnages dessinés, qui ne se transposent pas
          à une bibliothèque de traits — et qui sont hors de question ici. */}
      <div style={{
        width: iconBox,
        height: iconBox,
        borderRadius: "var(--radius-card)",
        background: T.surfaceCreuse,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
      }}>
        <Icon size={iconSize} strokeWidth={2} color={T.textSub} />
      </div>
      <div style={{ fontSize: titleSize, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {title}
      </div>
      {description && (
        <div style={{ ...TYPE.body, color: T.textSub, maxWidth: 320 }}>
          {description}
        </div>
      )}
      {/* Un état vide PROPOSE une action, il ne la range pas au second plan :
          d'où le CTA plein, là où c'était un bouton discret et compact. */}
      {action && (
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
