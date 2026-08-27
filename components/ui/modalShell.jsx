"use client";

/**
 * Chrome de modale de la DA : coquille, champs, pilules et boutons.
 *
 * Ces primitives vivaient dans `components/modals/AccountModals.jsx` du dépôt
 * trading — elles n'avaient rien de trading, seulement l'adresse. Le partage
 * s'arrête à la copie : les deux apps peuvent divergier.
 */

import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { T } from "@/lib/ui/tokens";
import { t } from "@/lib/i18n";
import { backdropDismiss } from "@/lib/hooks/useBackdropDismiss";
import { BTN } from "@/lib/ui/buttons";

export function ModalShell({ title, subtitle, onClose, children, footer, width = 480 }) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(
    <div
      {...backdropDismiss(onClose)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-modal"
        style={{
          background: T.white, borderRadius: "var(--radius-modal)", width: "100%", maxWidth: width,
          boxShadow: "var(--elev-overlay)", border: `2px solid ${T.border}`,
          display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 32px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "20px 20px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: T.textMut, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, borderRadius: "var(--radius-card)", border: "none",
              background: "transparent", color: T.textMut, cursor: "pointer", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.accentBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* `minHeight: 0` : sans lui, un enfant flex refuse de descendre sous sa
            hauteur de contenu et le corps ne défile jamais — il déborde. */}
        <div className="scroll-thin" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minHeight: 0 }}>
          {children}
        </div>

        {footer && (
          <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: T.textSub }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: T.textMut, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", minHeight: 44, boxSizing: "border-box", padding: "0 12px",
  borderRadius: "var(--radius-field)",
  border: `2px solid ${T.border}`, background: T.surfaceCreuse,
  fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none",
};

export function TextInput({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = T.border2; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
      {...rest}
    />
  );
}

/** Sélecteur en pilules (type de compte). */
export function PillGroup({ options, value, onChange, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            style={{
              ...BTN.md,
              border: `1px solid ${active ? T.text : T.border}`,
              background: active ? T.text : T.white,
              color: active ? T.bg : T.text,
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              transition: "background 140ms ease, border-color 140ms ease, color 140ms ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, disabled, tone = "text" }) {
  const bg = tone === "danger" ? T.red : T.text;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN.md,
        border: `1px solid ${bg}`, background: bg, color: "#fff",
        fontSize: 14, fontWeight: 500, fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, tone }) {
  const color = tone === "danger" ? T.red : T.text;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...BTN.md,
        border: `1px solid ${tone === "danger" ? T.redBd : T.border}`,
        background: T.white, color,
        fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
