import { describe, it, expect } from "vitest";
import { deepen, luminance, mixHex, shade, tint } from "@/lib/ui/color";
import { HUE } from "@/lib/ui/palette";

/* Ce que ce module décide, et que rien d'autre ne tient :
     — le mélange lui-même, y compris son refus poli des entrées qu'il ne
       comprend pas ;
     — et surtout `deepen`, qui garantit qu'un glyphe BLANC se lit sur n'importe
       quelle teinte de la palette des postes. C'est une promesse de contraste :
       elle doit tenir pour les vingt-huit couleurs, pas pour celles qu'on a
       regardées. */

/** Contraste d'un blanc pur sur un fond, au sens WCAG. */
const contrastOnWhiteInk = (bg: string) => 1.05 / (luminance(bg) + 0.05);

describe("Mélange de couleurs", () => {
  it("mélange en sRGB, aux deux bouts comme au milieu", () => {
    expect(mixHex("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(mixHex("#000000", "#FFFFFF", 1)).toBe("#ffffff");
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(tint("#2C72C3", 0.5)).toBe("#96b9e1");
    expect(shade("#2C72C3", 0.5)).toBe("#163962");
  });

  it("rend l'entrée telle quelle quand ce n'est pas de l'hexadécimal", () => {
    // Un `var(--…)` vaut mieux qu'un noir de repli, qui passerait pour un choix.
    expect(mixHex("var(--color-text)", "#FFFFFF", 0.5)).toBe("var(--color-text)");
    expect(luminance("var(--color-text)")).toBe(0);
  });
});

describe("Fond qui porte un glyphe blanc", () => {
  it("laisse intactes les couleurs déjà sombres", () => {
    // Bordeaux, brun, vert profond : ils portent le blanc sans qu'on y touche.
    for (const c of ["#8C3A56", "#96590E", "#147D64", "#2C72C3"]) {
      expect(deepen(c)).toBe(c);
    }
  });

  it("assombrit les claires jusqu'au seuil, et pas plus", () => {
    const clair = "#63BCD1"; // cyan clair : 1,9:1 en blanc, illisible
    expect(contrastOnWhiteInk(clair)).toBeLessThan(3);
    const fonce = deepen(clair);
    expect(fonce).not.toBe(clair);
    expect(contrastOnWhiteInk(fonce)).toBeGreaterThanOrEqual(3);
    /* Assombrie, pas éteinte : une passe de plus la ferait virer au noir et la
       colonne d'icônes perdrait ses teintes. */
    expect(luminance(fonce)).toBeGreaterThan(0.12);
  });

  it("tient pour TOUTE la charte", () => {
    for (const color of Object.values(HUE)) {
      expect(contrastOnWhiteInk(deepen(color))).toBeGreaterThanOrEqual(3);
    }
  });

  /* Le sens inverse : un disque quasi blanc et le glyphe à pleine couleur.
     C'est celui-là qui doit tenir 4,5:1, un trait de 2 px n'ayant pas
     l'épaisseur d'un aplat. Les deux constantes viennent de la vignette de
     poste de l'app finance (`components/ui/CategoryIcon`), qui vit maintenant
     dans le dépôt trading ; la garantie de `deepen`/`tint`, elle, appartient à
     ce module et doit tenir pour toute la charte. */
  it("laisse un glyphe lisible sur un disque presque blanc de la même teinte", () => {
    const DISC_TINT = 0.88;
    const GLYPH_MAX_LUM = 0.13;

    for (const color of Object.values(HUE)) {
      const disc = tint(color, DISC_TINT);
      const glyphe = deepen(color, GLYPH_MAX_LUM);
      const ratio = (luminance(disc) + 0.05) / (luminance(glyphe) + 0.05);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
