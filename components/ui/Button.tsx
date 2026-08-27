"use client";

import React, { forwardRef } from "react";
import { BTN } from "@/lib/ui/buttons";
import { T } from "@/lib/ui/tokens";
import { CAPS } from "@/lib/ui/type";
import { hasFinePointer } from "@/lib/ui/pointer";
import { Loader2, LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon: Icon,
    iconPosition = "left",
    fullWidth = false,
    children,
    style,
    onMouseEnter,
    onMouseLeave,
    disabled,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  /* Les trois tailles ne sont plus décrites ici : elles viennent de BTN
     (lib/ui/buttons.ts), qui est la seule table de hauteurs de boutons du
     site. Ce composant en donnait sa propre version — proche, mais pas
     identique à celle de `PillButton` — et deux boutons de la même « taille
     md » ne faisaient donc pas la même hauteur selon le composant employé.
     `height` et non `minHeight` : ce bouton-ci fixe sa hauteur. */
  const metrics = BTN[size];
  const sizeStyles: React.CSSProperties = {
    padding: metrics.padding,
    fontSize: metrics.fontSize,
    height: metrics.minHeight,
    borderRadius: metrics.borderRadius,
  };

  /* Trait de 2, l'épaisseur de bordure de la DA. 16 dans un bouton sm/md,
     20 dans un lg — une icône prend la taille de son rôle, pas une valeur
     choisie bouton par bouton. */
  const iconSize = size === "lg" ? 20 : 16;

  /* Un aplat, une encre, une arête de SA famille. `primary` n'est plus un
     aplat d'encre noire : le CTA prend la couleur d'action, et le vert ne dit
     plus que le succès. L'encre posée dessus est `encreSurCouleur` et non du
     blanc — blanc sur Macaw rend 2,44:1, sur Owl 2,09:1.
     `secondary` prend `border2` en arête : la même couleur que sa bordure ne
     montrerait aucune épaisseur. */
  const variantStyles: Record<Variant, { background: string; color: string; arete: string | null; border?: string; caps?: boolean }> = {
    primary:   { background: T.action, color: T.encreSurCouleur, arete: T.areteAction, caps: true },
    success:   { background: T.green,  color: T.encreSurCouleur, arete: T.areteSucces, caps: true },
    secondary: { background: T.white,  color: T.text,            arete: T.border2, border: T.border },
    ghost:     { background: "transparent", color: T.text,       arete: null },
    danger:    { background: T.red,    color: T.encreSurCouleur, arete: T.areteAlerte },
  };

  const skin = variantStyles[variant];
  /* Désactivé : le creux et l'encre inactive REMPLACENT la peau, au lieu d'une
     opacité qui salit la couleur sans la retirer — un bouton primaire à 55 %
     reste plus visible que les actions réellement disponibles autour de lui.
     Plus d'arête non plus : ce qui ne s'enfonce pas ne doit pas en avoir l'air.
     Un `ghost` désactivé reste transparent : lui poser le creux en ferait un
     bouton là où il n'y en avait pas. */
  const off = isDisabled
    ? { background: variant === "ghost" ? "transparent" : T.surfaceCreuse, color: T.textOff, arete: null, border: variant === "secondary" ? T.border : undefined, caps: false }
    : skin;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: metrics.gap,
    fontWeight: off.caps ? 700 : metrics.fontWeight,
    ...(off.caps ? CAPS : null),
    fontFamily: "var(--font-sans)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    background: off.background,
    color: off.color,
    borderWidth: off.border ? 2 : 0,
    borderStyle: "solid",
    borderColor: off.border || "transparent",
    boxShadow: off.arete ? `0 ${metrics.arete}px 0 ${off.arete}` : "none",
    ["--arete-y" as string]: `${metrics.arete}px`,
    /* `background-color` et non `background` : le raccourci embarque aussi
       `background-image`, `background-position` et compagnie — on demandait au
       navigateur de surveiller cinq propriétés pour n'en faire varier qu'une.
       Courbes prises dans les tokens plutôt que réécrites à la main : elles
       étaient recopiées littéralement à douze endroits du site, ce qui rendait
       toute correction de la courbe illusoire. */
    transition:
      "background-color 150ms var(--ease-out), color 150ms var(--ease-out), border-color 150ms var(--ease-out), transform 160ms var(--ease-out), box-shadow 150ms var(--ease-out)",
    width: fullWidth ? "100%" : undefined,
    whiteSpace: "nowrap",
    ...sizeStyles,
    ...style,
  };

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      data-arete={off.arete ? "" : undefined}
      style={baseStyle}
      /* Survol : l'aplat se mélange à 8 % vers sa propre couleur d'arête. Une
         table de couleurs de survol écrites à la main disparaît avec cette
         règle — dont un `#DC2626` qui n'était même pas dans la palette.
         L'arête ne bouge pas : c'est l'appui qui la fait tomber. */
      onMouseEnter={(e) => {
        if (!isDisabled && hasFinePointer()) {
          const el = e.currentTarget;
          /* Valeur de départ réelle, pas celle de la variante : un bouton avec
             `style={{ background: … }}` se voyait repeindre aux couleurs de sa
             variante dès qu'on le survolait une fois. */
          el.dataset.restBg = el.style.background || (skin.background as string);
          el.style.background = skin.arete
            ? `color-mix(in srgb, ${skin.arete} 8%, ${skin.background})`
            : T.surfaceCreuse;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = el.dataset.restBg || (skin.background as string);
        onMouseLeave?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} strokeWidth={2} className="anim-spin" />
      ) : (
        Icon && iconPosition === "left" && <Icon size={iconSize} strokeWidth={2} />
      )}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === "right" && <Icon size={iconSize} strokeWidth={2} />}
    </button>
  );
});

export default Button;
