import { describe, it, expect } from "vitest";
import {
  FEE_MICRO_ROUNDTRIP,
  FEE_MINI_ROUNDTRIP,
  applyNetPnl,
  calculateFees,
  isMicroContract,
  withNetPnl,
} from "@/lib/tradeFees";

/* Ce module est DUPLIQUÉ dans le dépôt `tr4de` (l'app trading), à l'identique.
   C'est la conséquence assumée de la séparation des deux apps : rien n'est
   partagé en paquet commun. Mais ici la duplication a un coût particulier — les
   deux apps lisent les MÊMES lignes de `apex_trades`, dans la même base
   Supabase, et doivent donc en tirer le même chiffre. Un objectif « +2 000 $ ce
   mois-ci » qui compterait des frais différents du tableau de bord de trading
   afficherait deux P&L pour un seul mois de trades, et c'est le genre d'écart
   qu'on ne voit qu'après avoir cherché ailleurs pendant une heure.

   Ce test épingle donc le barème en VALEURS ÉCRITES, pas en constantes relues :
   relire la constante ne vérifierait rien du tout. Le même fichier de test
   existe dans `tr4de` — si le barème change d'un côté seulement, l'un des deux
   dépôts casse, et c'est exactement ce qu'on veut. */

describe("Barème de frais, à garder identique dans les deux dépôts", () => {
  it("tient les deux montants aller-retour par contrat", () => {
    expect(FEE_MICRO_ROUNDTRIP).toBe(1.82);
    expect(FEE_MINI_ROUNDTRIP).toBe(5.76);
  });

  it("reconnaît un micro par son symbole, jamais par sa taille", () => {
    // Le préfixe « M » est la seule marque d'un micro : MNQ face à NQ.
    expect(isMicroContract("MNQ")).toBe(true);
    expect(isMicroContract("mes")).toBe(true);
    expect(isMicroContract("NQ")).toBe(false);
    expect(isMicroContract("ES")).toBe(false);
    // Rien à lire : on ne devine pas, on tombe sur mini (le barème le plus haut,
    // donc l'estimation prudente).
    expect(isMicroContract(undefined)).toBe(false);
    expect(isMicroContract("")).toBe(false);
  });

  it("multiplie par la quantité de contrats, et non par un montant fixe", () => {
    expect(calculateFees({ symbol: "MNQ", quantity: 3 })).toBeCloseTo(5.46, 5);
    expect(calculateFees({ symbol: "NQ", quantity: 2 })).toBeCloseTo(11.52, 5);
    // Quantité absente ou absurde → un contrat, pas zéro : un trade sans frais
    // gonflerait le P&L d'un compte réel.
    expect(calculateFees({ symbol: "NQ" })).toBeCloseTo(5.76, 5);
    expect(calculateFees({ symbol: "NQ", quantity: 0 })).toBeCloseTo(5.76, 5);
  });

  it("laisse un montant saisi à la main primer sur le barème", () => {
    // Le barème est une estimation ; ce que le courtier a réellement facturé,
    // quand on le connaît, est la vérité.
    expect(calculateFees({ symbol: "MNQ", quantity: 10, fees: 4 })).toBe(4);
    expect(calculateFees({ symbol: "MNQ", commission: 7.5 })).toBe(7.5);
    // Zéro n'est pas une saisie : c'est la valeur d'un champ vide.
    expect(calculateFees({ symbol: "NQ", fees: 0 })).toBeCloseTo(5.76, 5);
  });

  it("expose un P&L net et garde le brut, sans jamais déduire deux fois", () => {
    const brut = { symbol: "NQ", quantity: 1, pnl: 100 };
    const une = applyNetPnl(brut);
    expect(une.pnlGross).toBe(100);
    expect(une.pnl).toBeCloseTo(94.24, 5);
    /* Idempotence : le hook de lecture normalise à chaque rendu, et l'app perso
       relit les mêmes trades que l'app trading. Ré-appliquer doit rendre le même
       net, sinon les frais s'empilent au fil des rafraîchissements. */
    const deux = applyNetPnl(une);
    expect(deux.pnl).toBeCloseTo(94.24, 5);
    expect(deux.pnlGross).toBe(100);
  });

  it("rend la liste inchangée quand ce n'en est pas une", () => {
    // La lecture Supabase peut rendre null : `withNetPnl` ne doit pas jeter, la
    // page doit s'afficher vide plutôt que blanche.
    expect(withNetPnl(null as never)).toBe(null);
    expect(withNetPnl([])).toEqual([]);
  });
});
