"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/supabaseAuthProvider";
import { withNetPnl } from "@/lib/tradeFees";

/**
 * Trades et comptes de trading, en LECTURE SEULE.
 *
 * Pourquoi ce hook existe dans l'app perso : un objectif peut se mesurer sur le
 * P&L d'un compte (cf. `AUTO_TYPES` dans `components/pages/GoalsPage.jsx`).
 * Sans cette lecture, l'objectif « +2 000 $ ce mois-ci » redeviendrait un
 * compteur qu'on avance à la main — c'est-à-dire un chiffre qu'on recopie
 * depuis l'autre app, donc un chiffre qui se périme.
 *
 * C'est possible parce que la base Supabase est **partagée** avec le dépôt
 * `tr4de` : `apex_trades` et `trading_accounts` sont les tables de cette app-là,
 * lues ici sous la même session utilisateur (les policies RLS filtrent déjà sur
 * `user_id`).
 *
 * **Lecture seule, et c'est la règle.** Aucune écriture, aucun cache
 * localStorage, aucune notion de trade « en attente ». Les trades s'écrivent
 * dans `tr4de` et nulle part ailleurs — une deuxième source d'écriture sur les
 * mêmes lignes est exactement ce que la séparation des deux apps devait éviter.
 * D'où un hook à part et non une copie de `useTradeData` : celui-là sait ajouter,
 * modifier et supprimer, et il n'y a rien ici qui doive pouvoir le faire.
 *
 * Le P&L est rendu NET de frais (`withNetPnl`, brut conservé dans `pnlGross`),
 * comme dans `tr4de` : c'est la seule façon qu'un objectif affiche le même
 * chiffre que le tableau de bord de trading. Le barème vit dans
 * `lib/tradeFees.ts`, dupliqué depuis l'autre dépôt — s'il y change, il change
 * ici aussi, sinon les deux apps ne comptent plus la même chose.
 */

export interface PnlTrade {
  id?: string;
  account_id?: string | null;
  date?: string | null;
  symbol?: string | null;
  pnl?: number | null;
  pnlGross?: number | null;
  [key: string]: unknown;
}

export interface PnlAccount {
  id: string;
  name?: string | null;
  account_type?: string | null;
  [key: string]: unknown;
}

export interface TradingPnl {
  trades: PnlTrade[];
  accounts: PnlAccount[];
  /** Faux dès que la PREMIÈRE requête a répondu, succès ou échec. */
  loading: boolean;
  /** Non nul quand la lecture a échoué — l'app perso doit rester utilisable. */
  error: string | null;
  refresh: () => void;
}

const isUuid = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function useTradingPnl(): TradingPnl {
  const { user } = useAuth();
  const userId = user?.id;
  const [trades, setTrades] = useState<PnlTrade[]>([]);
  const [accounts, setAccounts] = useState<PnlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /* Un compteur plutôt qu'un booléen : `refresh()` doit pouvoir relancer la
     lecture autant de fois qu'on l'appelle, y compris deux fois de suite. */
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    /* Pas d'utilisateur : la requête ne partira jamais, et laisser le drapeau
       levé figerait les pages qui l'attendent sur leur squelette. */
    if (!isUuid(userId)) {
      setTrades([]);
      setAccounts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      try {
        /* Les deux requêtes en parallèle : un objectif filtré sur un type de
           compte a besoin des deux, et les enchaîner doublerait l'attente pour
           rien. */
        const [tradesRes, accountsRes] = await Promise.all([
          supabase.from("apex_trades").select("*").eq("user_id", userId),
          supabase.from("trading_accounts").select("*").eq("user_id", userId),
        ]);
        if (cancelled) return;
        if (tradesRes.error) throw tradesRes.error;
        if (accountsRes.error) throw accountsRes.error;
        setTrades(withNetPnl((tradesRes.data || []) as PnlTrade[]));
        setAccounts((accountsRes.data || []) as PnlAccount[]);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        /* On n'efface PAS ce qui était déjà affiché : un objectif qui montrait
           un P&L ne doit pas retomber à zéro parce qu'un rafraîchissement a
           échoué — zéro est une valeur, pas une absence de valeur. */
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, tick]);

  return useMemo(
    () => ({ trades, accounts, loading, error, refresh }),
    [trades, accounts, loading, error, refresh]
  );
}
