"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { CountUp } from "./CountUp";
import { T } from "@/lib/ui/tokens";
import { TYPE, TS, CAPS, TABULAR } from "@/lib/ui/type";

interface StatProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  trend?: { value: number; period?: string };
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  positive?: boolean;
  negative?: boolean;
  onClick?: () => void;
  /** Sans bordure ni arrondi propre — pour coller plusieurs Stat dans un conteneur commun. */
  flat?: boolean;
  /**
   * Anime la valeur en count-up. Passe la valeur numérique cible ici (au lieu
   * de `value`) ; `format`/`prefix`/`suffix`/`decimals` contrôlent l'affichage.
   * Si absent, `value` (ReactNode) est rendu tel quel.
   */
  countUp?: number;
  countUpFormat?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function Stat({ label, value, subtext, trend, icon: Icon, size = "md", positive, negative, onClick, flat, countUp, countUpFormat, prefix, suffix, decimals }: StatProps) {
  /* Les trois tailles de valeur, ramenées sur l'échelle : 18 et 32 n'étaient
     sur aucun des dix crans — ils passaient au travers du garde-fou parce
     qu'ils étaient écrits en ternaire. */
  const valueSize = size === "sm" ? TS.headline : size === "md" ? TS.title2 : TS.title1;

  const valueColor = positive ? T.green : negative ? T.red : T.text;

  const content = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {Icon && <Icon size={16} strokeWidth={2} color={T.textSub} />}
        {/* Capitales espacées, graisse 500 — l'un des trois seuls emplois de la
            casse capitale de la DA, et l'exception assumée à son 700 : une
            grille de mesures empile des dizaines de ces libellés, et à 700 ils
            pèseraient plus lourd que les chiffres qu'ils annoncent. */}
        <span style={{ ...TYPE.label, ...CAPS, color: T.textSub }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: valueSize, fontWeight: 800, color: valueColor, lineHeight: 1.1, letterSpacing: "-0.02em", fontFamily: "var(--font-sans)", ...TABULAR }}>
        {typeof countUp === "number"
          ? <CountUp value={countUp} format={countUpFormat} prefix={prefix} suffix={suffix} decimals={decimals ?? 0} />
          : value}
      </div>
      {(subtext || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, ...TYPE.caption, color: T.textSub }}>
          {trend && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: trend.value >= 0 ? T.green : T.red, fontWeight: 600, ...TABULAR }}>
              {trend.value >= 0 ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
              {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}%
              {trend.period && <span style={{ color: T.textMut, fontWeight: 400 }}>{trend.period}</span>}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        data-arete={flat ? undefined : ""}
        style={{
          background: T.white,
          borderWidth: flat ? 0 : 2,
          borderStyle: "solid",
          borderColor: flat ? "transparent" : T.border,
          borderRadius: flat ? 0 : "var(--radius-card)",
          padding: 16,
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          boxShadow: flat ? "none" : T.areteCarte,
          ["--arete-y" as string]: "6px",
          transition: "border-color 120ms ease",
        }}
        /* Au survol, seule la bordure se soutient : un bloc à arête est posé,
           il ne lévite pas. L'ombre floue du survol disparaît sans remplaçant. */
        onMouseEnter={(e) => { if (!flat) e.currentTarget.style.borderColor = T.border2; }}
        onMouseLeave={(e) => { if (!flat) e.currentTarget.style.borderColor = T.border; }}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={{
      background: T.white,
      border: flat ? "none" : `2px solid ${T.border}`,
      borderRadius: flat ? 0 : "var(--radius-card)",
      padding: 16,
      boxShadow: flat ? "none" : T.areteCarte,
    }}>
      {content}
    </div>
  );
}
