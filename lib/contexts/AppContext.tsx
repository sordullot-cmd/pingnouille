"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/supabaseAuthProvider";

/**
 * État applicatif global de l'app perso : l'identité et la page courante, rien
 * de plus.
 *
 * La coquille étant une SPA (cf. `components/DashboardNew.jsx`), `page` est la
 * seule « route » : les composants profonds naviguent par `setPage()` sans
 * qu'on fasse descendre la fonction de props en props.
 *
 * Historiquement ce contexte portait aussi les trades, les stratégies et les
 * comptes de trading — ils vivent maintenant dans l'app trading (dépôt
 * `tr4de`), qui partage la même base Supabase mais plus ce code.
 */
export interface AppContextValue {
  userId: string | null;
  userEmail: string | null;

  page: string;
  setPage: (p: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  initialPage?: string;
}

export function AppProvider({ children, initialPage = "daily-planner" }: AppProviderProps) {
  const { user } = useAuth();

  // Init depuis le hash de l'URL (#agenda, …) — utilisé notamment par le
  // retour OAuth Google Agenda. Sinon, page par défaut.
  const [page, setPage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hash.replace(/^#/, "").trim();
      if (h) return h;
    }
    return initialPage;
  });

  // Synchronise la navigation par hash (#page) après le montage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "").trim();
      if (h) setPage(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const value: AppContextValue = {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    page,
    setPage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * useApp — accède à l'état applicatif global (identité, page courante).
 * Le composant appelant doit être dans <AppProvider/>.
 */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp() must be used within <AppProvider>");
  return ctx;
}
