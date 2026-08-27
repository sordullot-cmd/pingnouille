"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/supabaseAuthProvider";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useAgendaReminders } from "@/lib/hooks/useAgendaReminders";
import { useActivityTracker } from "@/lib/hooks/useActivityTracker";
import { useApp } from "@/lib/contexts/AppContext";
import DailyPlannerPage from "@/components/pages/DailyPlannerPage";
import SportPage from "@/components/pages/SportPage";
import ReadingListPage from "@/components/pages/ReadingListPage";
import NotesPage from "@/components/pages/NotesPage";
import RevisionsPage from "@/components/pages/RevisionsPage";
import FocusPage from "@/components/pages/FocusPage";
import FocusSentinel from "@/components/focus/FocusSentinel";
import DrivePage from "@/components/pages/DrivePage";
import LifeRpgPage from "@/components/pages/LifeRpgPage";
import ActivityPage from "@/components/pages/ActivityPage";
import ActivityReportsPage from "@/components/pages/ActivityReportsPage";
import ActivityRulesPage from "@/components/pages/ActivityRulesPage";
import EloquencePage from "@/components/pages/EloquencePage";
import AgendaPage from "@/components/pages/AgendaPage";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AlertToast from "@/components/AlertToast";
import CommandPalette from "@/components/CommandPalette";
import SettingsPage from "@/components/pages/SettingsPage";
import Sidebar from "@/components/ui/Sidebar";
import { T } from "@/lib/ui/tokens";
import { t, useLang } from "@/lib/i18n";
import {
  Mountain,
  Menu as LucideMenu,
  CalendarDays as LucideCalendarDays,
  CalendarClock as LucideCalendarClock,
  Dumbbell as LucideDumbbell,
  FileText as LucideFileText,
  Mic as LucideMic,
  Brain as LucideBrain,
  ShieldOff as LucideShieldOff,
  Activity as LucideActivity,
} from "lucide-react";

/* ─── TOKENS ───────────────────────────────────────────────────────────
   Source unique et dark-aware : lib/ui/tokens.ts (les valeurs sont des
   var(--color-*), donc le thème sombre bascule nativement). */

const css = `
  body { background: ${T.bg}; color: ${T.text}; font-family: var(--font-sans); min-height: 100vh; font-size: 14px; }
  button { font-family: inherit; cursor: pointer; }
  select { font-family: inherit; }
  /* Pas d'animation d'entrée de page : anim-1 / anim-2 sont neutralisés
     globalement (globals.css). */
  .nav-item:hover { background: ${T.accentBg} !important; }
  .card-hover:hover { border-color: ${T.border2} !important; box-shadow: 0 4px 12px rgba(0,0,0,.06) !important; }
`;

/* Pages portées à la nouvelle DA : le conteneur de contenu les laisse posées à
   même le fond gris du shell, sans cadre blanc pleine page — elles posent leurs
   propres cartes, gèrent leur gouttière et peuvent la reprendre en marge négative
   (cf. --page-gutter).
   Une page rejoint cette liste quand ses blocs sont devenus des cartes `CARD` —
   sinon elle flotterait sur le gris sans rien pour porter son contenu. */
const DA_PAGES = ["life-rpg", "goals", "daily-planner", "agenda", "activity", "activity-reports", "activity-rules", "focus", "sport", "notes", "revisions", "eloquence"];

/* Page d'atterrissage. La journée qu'on prépare est ce qu'on ouvre en premier —
   il n'y a pas ici de tableau de bord qui résume les autres pages. */
const HOME_PAGE = "daily-planner";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  useLang(); // re-render app on language change

  // Re-render quand l'utilisateur change la devise / le fuseau horaire dans Settings.
  const [, forcePrefRefresh] = useState(0);
  useEffect(() => {
    const onPrefs = () => forcePrefRefresh(v => v + 1);
    window.addEventListener("tr4de:prefs-changed", onPrefs);
    return () => window.removeEventListener("tr4de:prefs-changed", onPrefs);
  }, []);

  const { page, setPage } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebarCollapsed") === "1";
  });
  /* Largeur réelle de la barre latérale, remontée par Sidebar : elle suit son
     libellé le plus long, on ne peut donc plus la déduire d'une constante.
     Valeur initiale = l'ancienne largeur fixe, pour que le premier rendu (avant
     la première mesure) ne décale pas le contenu. */
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 220;
    return localStorage.getItem("sidebarCollapsed") === "1" ? 56 : 220;
  });

  // Rappels d'agenda → vraies notifications système, quelle que soit la page.
  useAgendaReminders();
  /* Suivi d'activité du poste : la boucle d'échantillonnage vit ICI et non dans
     la page « Activité ». Le temps passé sur les autres applications doit être
     mesuré même quand on regarde une autre page — c'est tout l'objet de la
     mesure — et deux boucles compteraient le même temps deux fois. */
  useActivityTracker();

  // Construire l'objet affichage utilisateur à partir de l'utilisateur authentifié
  const displayUser = {
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Moi",
    email: user?.email || "",
    initials: (user?.email?.split('@')[0] || "PN").substring(0, 2).toUpperCase(),
    avatarUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      // ⏳ Attendre 500ms pour s'assurer que la session est complètement effacée
      // et que les listeners d'auth ont le temps de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 500));

      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      console.error("❌ Erreur lors de la déconnexion:", err);
      window.location.href = '/login';
    }
  };

  // ATTENDRE que l'authentification soit complètement chargée avant de rediriger
  useEffect(() => {
    if (authLoading) return;
    if (!user) window.location.href = '/login';
  }, [authLoading, user]);

  /* Une seule section, et donc pas de titre de section : l'app entière EST la
     vie perso, une bande « Vie perso » au-dessus de la liste ne dirait rien de
     plus. L'ordre est celui de la journée : ce qu'on prévoit, ce qu'on mesure,
     ce vers quoi on va, ce qui protège le temps, puis les pratiques.
     Le trading et l'argent personnel vivent dans l'autre app (dépôt `tr4de`). */
  const SIDEBAR_SECTIONS = [
    {
      items: [
        { id: "daily-planner", icon: LucideCalendarDays, label: t("nav.dailyPlanner") },
        { id: "agenda",        icon: LucideCalendarClock, label: t("nav.agenda") },
        /* « Activité » suit immédiatement le calendrier : les deux disent le
           même sujet — le temps — mais celle-ci le MESURE au lieu de le
           prévoir. On y va pour vérifier ce que la journée prévue est devenue,
           donc juste après l'avoir regardée. */
        { id: "activity",      icon: LucideActivity,     label: t("nav.activity") },
        /* « Objectifs » a fusionné dans « Quête de soi » : une seule entrée,
           la page porte les catégories PUIS la liste des objectifs. */
        { id: "life-rpg",      icon: Mountain,           label: t("nav.lifeRpg") },
        /* « Focus » suit les objectifs : c'est la page qui PROTÈGE le temps
           qu'on vient de se fixer. On l'ouvre pour pouvoir travailler à ce qui
           précède, pas pour y consulter quelque chose — un interrupteur posé
           contre son objet, et non une destination. */
        { id: "focus",         icon: LucideShieldOff,    label: t("nav.focus") },
        { id: "sport",         icon: LucideDumbbell,     label: "Sport" },
        { id: "notes",         icon: LucideFileText,     label: t("nav.notes") },
        /* « Révisions » suit « Notes » : c'est là qu'on écrit ce qu'on veut
           retenir, et l'atelier des révisions part précisément de ces notes. */
        { id: "revisions",     icon: LucideBrain,        label: t("nav.revisions") },
        { id: "eloquence",     icon: LucideMic,          label: t("nav.eloquence") },
      ],
    },
  ];

  // Raccourcis clavier : Alt+1..9 pour naviguer entre les pages de la sidebar
  const flatNavIds = SIDEBAR_SECTIONS.flatMap(s => s.items.map(i => i.id));

  /* Pages visitées, de la plus récente à la plus ancienne — la page courante
     en tête. C'est un ordre d'USAGE, pas l'ordre de la sidebar : Ctrl+Tab
     faisait défiler la navigation cran par cran, ce qui obligeait à traverser
     huit pages pour revenir à celle qu'on quittait. Il ramène maintenant sur
     la dernière page visitée, comme Alt+Tab entre deux fenêtres.
     Les pages de détail comptent aussi : c'est souvent d'elles qu'on part et
     vers elles qu'on veut revenir.
     Un `ref` et non un `state` : cet historique ne se dessine pas, et le
     remonter dans un état déclencherait un rendu de plus à chaque
     navigation. */
  const pageHistory = useRef([page]);
  useEffect(() => {
    const seen = pageHistory.current;
    if (seen[0] === page) return;
    // La page revisitée remonte en tête au lieu de s'empiler deux fois : sinon
    // un aller-retour saturerait l'historique de la même paire.
    pageHistory.current = [page, ...seen.filter(id => id !== page)].slice(0, 12);
  }, [page]);

  /* Ctrl+Tab : la page la plus récente (donc aller-retour, puisque la page
     qu'on quitte passe aussitôt en tête). Ctrl+Shift+Tab : un cran plus loin
     dans l'historique — sans quoi le raccourci ferait exactement la même chose
     que sans Shift. Au démarrage, l'historique n'a qu'une entrée : il n'y a
     alors nulle part où revenir et le raccourci ne fait rien, plutôt que de
     sauter sur une page qu'on n'a jamais ouverte. */
  const goRecent = (rank) => {
    const target = pageHistory.current[rank] ?? pageHistory.current[1];
    if (!target || target === page) return;
    setPage(target);
    setMobileNavOpen(false);
  };
  useKeyboardShortcuts([
    ...flatNavIds.slice(0, 9).map((id, i) => ({
      key: String(i + 1),
      alt: true,
      handler: (e) => { e.preventDefault(); setPage(id); setMobileNavOpen(false); },
    })),
    {
      key: "Tab",
      ctrlOrCmd: true,
      ignoreInInputs: false,
      handler: (e) => { e.preventDefault(); goRecent(1); },
    },
    {
      key: "Tab",
      ctrlOrCmd: true,
      shift: true,
      ignoreInInputs: false,
      handler: (e) => { e.preventDefault(); goRecent(2); },
    },
  ]);

  const pages = {
    "daily-planner": <DailyPlannerPage />,
    agenda: <AgendaPage />,
    activity: <ActivityPage setPage={setPage} />,
    "activity-reports": <ActivityReportsPage setPage={setPage} />,
    "activity-rules": <ActivityRulesPage setPage={setPage} />,
    "life-rpg": <LifeRpgPage />,
    /* Ancienne route « Objectifs » : elle mène désormais à la page fusionnée,
       pour que les liens existants (palette de commandes, renvois d'autres
       pages) tombent au bon endroit plutôt que sur un doublon. */
    goals: <LifeRpgPage />,
    focus: <FocusPage />,
    sport: <SportPage />,
    notes: <NotesPage />,
    revisions: <RevisionsPage />,
    eloquence: <EloquencePage />,
    reading: <ReadingListPage />,
    drive: <DrivePage />,
    settings: <SettingsPage user={user} onBack={() => setPage(HOME_PAGE)} setPage={setPage} />,
  };

  // Écran de chargement pendant l'authentification ; le useEffect ci-dessus
  // redirige vers /login s'il n'y a finalement personne.
  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;

  return (
    <>
      <style>{css}</style>
      <AlertToast />
      <CommandPalette />
      {/* Blocage et programmes tournent ici, dans la coquille, et non dans la
          page Focus : un engagement pris pour la journée ne doit pas s'arrêter
          parce qu'on est allé voir ses notes. Ne rend que son écran de blocage,
          quand il y a lieu. */}
      <FocusSentinel />
      {/* `--shell-left` : la place tenue par la barre latérale (sa largeur + sa
          gouttière de 12 px). Elle n'est plus dans le flux — c'est ce padding
          qui la remplace, appliqué au conteneur SCROLLABLE et non au cadre :
          le contenu part ainsi du bord de la fenêtre, et un bloc pleine largeur
          peut reprendre cette réserve pour passer derrière la barre. Remise à 0
          en mobile, où la barre est un tiroir (cf. globals.css).

          Fond BLANC, et c'est le principe premier de la DA : le blanc n'est pas
          un fond, c'est la structure — 82,6 % des pixels des écrans de
          référence, sans un seul gris de remplissage. Ce sont ici et sur la
          barre du haut les DEUX seuls endroits qui posaient le gris de page ;
          `--color-bg-subtle` elle-même ne change pas de valeur, elle habille
          encore une douzaine de vues hors coquille et son rôle s'inverse en
          thème sombre. Les blocs se détachent maintenant par leur bordure de 2
          et leur arête basse, pas par un gris derrière eux. */}
      <div className="tr4de-root" style={{display:"flex",minHeight:"100vh",background:"var(--color-bg)","--shell-left":`${sidebarWidth + 12}px`}}>
        <Sidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => {
            setSidebarCollapsed(c => {
              const next = !c;
              try { localStorage.setItem("sidebarCollapsed", next ? "1" : "0"); } catch {}
              return next;
            });
          }}
          brand="pingnouille"
          user={{ name: displayUser.name, initials: displayUser.initials, avatarUrl: displayUser.avatarUrl }}
          onProfile={() => setPage("settings")}
          onSettings={() => setPage("settings")}
          onDarkMode={() => {
            const cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
            const next = cur === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = next;
            try { localStorage.setItem("tr4de_theme", next); } catch {}
          }}
          onLogout={handleLogout}
          /* La barre se dimensionne sur son libellé le plus long : on lit sa
             largeur réelle plutôt que de la deviner. */
          onWidthChange={setSidebarWidth}
          sections={SIDEBAR_SECTIONS}
          activeId={page}
          onSelect={(id) => { setPage(id); setMobileNavOpen(false); }}
        />

        {/* MAIN */}
        <div className="tr4de-main" style={{flex:1,minWidth:0,height:"100vh",display:"flex",flexDirection:"column",background:"transparent"}}>
          {/* Barre du haut. En desktop elle est VIDE (le hamburger est masqué) :
              ses 10 px en haut et en bas sont donc toute la marge qui sépare le
              contenu du bord de la fenêtre. C'est ici, et nulle part dans les
              pages, que se règle cette marge — le conteneur scrollable juste en
              dessous est à padding-top 0. Les media queries mobiles rendent à la
              barre son padding vertical, où le hamburger doit tenir. */}
          <div className="tr4de-topbar" style={{flexShrink:0,zIndex:10,background:"var(--color-bg)",padding:"10px 16px 10px calc(var(--shell-left, 0px) + 16px)",display:"flex",alignItems:"center",gap:12,fontFamily:"var(--font-sans)"}}>
            <button
              type="button"
              className="tr4de-hamburger"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Ouvrir le menu"
              style={{display:"none",width:36,height:36,borderRadius:8,border:"1px solid "+T.border,background:T.white,color:T.text,cursor:"pointer",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"inherit"}}
            >
              <LucideMenu size={18} strokeWidth={1.75} />
            </button>
          </div>
          {/* Pages déjà passées à la nouvelle DA : leurs sections sont des cartes
              blanches individuelles posées sur le FOND GRIS de la page. Les
              envelopper dans la carte blanche commune ferait disparaître ce fond
              et, avec lui, le détachement des cartes. */}
          {(() => { const daPage = DA_PAGES.includes(page); return (
          /* Sur les pages de la DA, ce cadre ne réserve RIEN à gauche : c'est le
             conteneur scrollable qui compense la barre latérale, pour que son
             bord (et son clip) parte du premier pixel. Les autres pages posent
             une carte blanche pleine page : elle, doit s'arrêter à la barre,
             sinon son fond s'étendrait derrière — d'où la réserve rendue ici. */
          <div style={{flex:1,minHeight:0,padding: daPage ? "0 0 8px 0" : "0 8px 8px 0",paddingLeft: daPage ? 0 : "var(--shell-left, 0px)",display:"flex"}}>
            <div className="scroll-thin" style={{
              background: daPage ? "transparent" : "var(--color-card-bg, #FFFFFF)",
              border: daPage ? "none" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: daPage ? 0 : 10,
              boxShadow: "none",
              /* Gouttière du site — UNE seule valeur, la même à gauche et à
                 droite. Les deux restent exposées en variables : une page peut
                 reprendre la gauche en marge négative pour un bloc pleine
                 largeur, sans la redéclarer en dur. */
              "--page-gutter-left": "40px",
              "--page-gutter": "var(--page-gutter-left)",
              /* Respiration verticale, elle aussi commune à TOUTES les pages :
                 les pages n'ont plus de `paddingTop` à elles, c'est le conteneur
                 qui défile qui la porte, une fois. */
              "--page-pad-top": "14px",
              "--page-pad-bottom": "24px",
              /* La réserve de la barre latérale est portée ICI, par le
                 conteneur scrollable lui-même, et pas par le cadre au-dessus :
                 c'est ce qui place son bord (donc son clip) au premier pixel de
                 la fenêtre. Un bloc pleine largeur reprend `--shell-left` +
                 `--page-gutter-left` en marge négative et file jusqu'au bord,
                 en passant derrière la barre. */
              "--content-left": "calc(var(--shell-left, 0px) + var(--page-gutter-left))",
              padding: daPage
                ? "var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom) var(--content-left)"
                // Hors DA, la réserve de la barre est déjà prise par le cadre
                // au-dessus : seule la gouttière reste à poser.
                : "var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom) var(--page-gutter-left)",
              display: "block",
              width: "100%",
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
            }}>
              <div key={page} style={{ width: "100%", minWidth: 0 }}>
                {pages[page] || pages[HOME_PAGE]}
              </div>
            </div>
          </div>
          ); })()}
        </div>
      </div>
    </>
  );
}
