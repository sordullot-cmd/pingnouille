# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce dépôt et l'autre

`pingnouille` est **la moitié vie perso** d'une app qui en portait deux. La
moitié trading et argent personnel (trades, comptes, prop firms, stratégies,
journal, discipline, patrimoine, cashflow, budget, agrégation bancaire) vit dans
le dépôt **`tr4de`**, dont ce dépôt est issu.

Les deux apps partagent :

- **la même base Supabase** — mêmes utilisateurs, mêmes tables. Les clés de
  `user_productivity` sont donc à ne PAS renommer : elles gardent leur préfixe
  `tr4de_` (`tr4de_sport_sessions`, `tr4de_notes`…) parce que ce sont les clés
  sous lesquelles les données de l'utilisateur sont déjà écrites ;
- **rien d'autre.** La direction artistique, `useCloudState`, l'auth, l'i18n et
  la coquille ont été DUPLIQUÉS, pas extraits en paquet commun : les deux apps
  peuvent divergier, et une correction de DA est à porter deux fois si on la
  veut des deux côtés.

Les migrations SQL des tables de trading restent dans `tr4de/supabase/`. Ici on
ne garde que celles qui touchent la productivité.

### La seule chose que cette app lit chez l'autre : le P&L

Un objectif peut se mesurer sur le P&L d'un compte de trading (« +2 000 $ ce
mois-ci »), son win rate, son nombre de trades ou son drawdown — c'est la raison
d'être de `lib/hooks/useTradingPnl.ts`, qui lit `apex_trades` et
`trading_accounts` dans la base partagée, sous la session de l'utilisateur (les
policies RLS filtrent déjà sur `user_id`).

Trois règles à ne pas défaire :

1. **Lecture seule.** Aucune écriture, aucun cache localStorage. Les trades
   s'écrivent dans `tr4de` et nulle part ailleurs — deux sources d'écriture sur
   les mêmes lignes est précisément ce que la séparation devait éviter. C'est
   pourquoi ce hook est écrit à part et n'est pas une copie de `useTradeData`,
   qui sait ajouter, modifier et supprimer.
2. **Le P&L est NET de frais**, comme dans `tr4de` (`withNetPnl`, brut conservé
   dans `pnlGross`). Sans cela un objectif afficherait un autre chiffre que le
   tableau de bord de trading pour les mêmes trades.
3. **`lib/tradeFees.ts` est dupliqué à l'identique** depuis `tr4de`. Le barème y
   est épinglé en valeurs écrites par `tests/tradeFees.test.ts`, présent dans les
   DEUX dépôts : changer le barème d'un seul côté casse l'autre, et c'est voulu.

Une lecture qui échoue n'efface pas ce qui était affiché et laisse le reste de
l'app utilisable : le P&L est un ornement de la page Objectifs, pas sa condition.

## Commands

```bash
npm run dev              # next dev
npm run build            # next build — vérifie aussi le prérendu des routes
npx vitest run           # suite complète
npx vitest run tests/focus.test.ts        # un seul fichier
npx vitest run -t "nom du cas"            # un seul cas
npm run lint             # eslint
npm run tauri:build      # binaire de bureau (nécessite cargo)
```

Rust : `cargo` n'est pas dans le `PATH` par défaut sur cette machine — utiliser
`PATH="$HOME/.cargo/bin:$PATH" cargo check --manifest-path src-tauri/Cargo.toml`.

**Bruit préexistant.** `npx tsc --noEmit` et `npm run lint:strict` remontent des
erreurs dans les fichiers hérités. Ce ne sont pas des régressions : filtrer sur
les fichiers touchés (`npx tsc --noEmit | grep '^lib/focus'`) plutôt que de lire
le total.

## Architecture

### L'app est une SPA déguisée en App Router

`app/dashboard/page.tsx` ne fait que monter `components/DashboardNew.jsx`, qui
est **la** coquille : un objet associe une chaîne (`page`) à un composant de
`components/pages/`, et `setPage()` navigue. Ajouter un écran = ajouter une
entrée dans cet objet, **pas** une route Next.

Les vraies routes sont réservées à ce qui doit vivre hors de la coquille et sans
authentification : `/login`, `/privacy`, `/terms`, `/blocked`, et `app/api/*`.

Conséquence à garder en tête : seule la page courante est montée. Tout ce qui
doit continuer à tourner quand on navigue ailleurs doit être monté **dans la
coquille**, pas dans une page. C'est le rôle de `components/focus/FocusSentinel.jsx`
(blocage et programmes de la page Focus) et de `useActivityTracker()` — le modèle
à suivre pour toute surveillance de fond.

### Deux étages de persistance

1. **Tables Supabase typées** — les projets de la page Drive, l'audio
   d'éloquence, les préférences. Migrations SQL dans `supabase/`.
2. **`useCloudState(storageKey, cloudKey, default)`** (`lib/hooks/useCloudState.ts`)
   — un JSON quelconque dans la table générique `user_productivity`.
   localStorage d'abord (instantané), upsert Supabase débouncé ensuite, et un
   **relais entre instances qui partagent une clé** : deux composants appelant le
   hook avec la même clé voient les mêmes écritures.

Le second étage est la voie normale pour toute nouvelle fonctionnalité : aucune
migration SQL, aucun schéma à décrire. Le magasin est normalisé à la lecture
(`normalizeStore`) au lieu d'être migré — un champ ajouté prend sa valeur par
défaut chez les anciens utilisateurs.

⚠️ Un mock de `useCloudState` dans un test **doit relayer entre instances**
(cf. `tests/focusPage.test.tsx`), sinon deux composants divergent et le test
échoue pour une raison qui n'a rien à voir avec ce qu'il vérifie.

### Coquille de bureau (Tauri v2)

`src-tauri/` — `frontendDist` pointe vers l'URL Vercel déployée : le binaire
n'embarque **aucun build JS**. Donc :

- une modification du front ne demande qu'un déploiement ;
- une modification Rust demande un `tauri:build` et une redistribution.

Les commandes sont déclarées dans `src-tauri/src/lib.rs` (`generate_handler!`).
Les commandes de l'app elle-même n'ont pas besoin d'entrée dans
`capabilities/default.json` (contrairement aux commandes de plugin) ; en
revanche `capabilities.remote.urls` autorise l'origine déployée à les appeler.

La coquille fournit : suivi d'activité (`tracker.rs`), blocage natif
(`blocker.rs` — lecture de l'onglet actif, fermeture d'application), relais
Android pour l'activité téléphone (`phone.rs`), icône dans la barre d'état,
démarrage automatique, et la croix ✕ qui masque au lieu de quitter.

C'est **cette** app qui porte le binaire de bureau : le tracker d'activité et le
blocage natif sont des fonctions perso. L'app trading reste web/PWA.

⚠️ L'app doit se reconnaître elle-même pour ne pas se compter dans son propre
suivi d'activité, ni se bloquer. Trois listes le disent, et elles doivent rester
d'accord : `lib/activity/catalog.ts` (entrée « pingnouille » de la section
`admin`), `SELF_APPS` dans `lib/focus/model.ts`, et `NEVER` dans
`src-tauri/src/blocker.rs`. Les anciens noms (`tao`, `tao trade`, `taotrade`) y
restent : un binaire déjà installé et l'historique déjà mesuré doivent continuer
à se reconnaître.

**Tout le front doit fonctionner sans la coquille.** Le test est `isTauri()`
(`lib/notify.ts`) ; les fonctions natives rendent `false` ou `null` en navigateur
plutôt que de jeter, et l'interface annonce la portée réelle du blocage selon la
coquille (navigateur / PWA installée / app de bureau).

### Direction artistique

- **Aucune couleur en dur.** Tout passe par `lib/ui/tokens.ts` (`T`, `HAIRLINE`,
  `FIELD_BG`, `CARD`), dont les valeurs sont des `var(--color-*)` — c'est ce qui
  fait suivre le thème sombre.
- **Échelle typographique imposée.** `lib/ui/type.ts` définit dix crans
  (10, 11, 12, 13, 14, 16, 20, 24, 28, 40) et des rôles (`TYPE.body`,
  `TYPE.title2`…). `tests/typeScale.test.ts` **fait échouer la suite** sur tout
  `fontSize` hors échelle. Étaler le rôle en premier, les exceptions après.
- Briques réutilisables dans `components/ui/da.jsx` (`CARD`, `PillButton`,
  `SectionTitle`, `PeriodPills`, `CheckBox`, `Modal`), `components/ui/form.jsx`
  (`Field`, `Input`) et `components/ui/modalShell.jsx` (`ModalShell`,
  `PrimaryBtn`, `GhostBtn`, `PillGroup`).

### Langue

`lib/i18n.ts` — français par défaut. Les tests d'interface vérifient des
libellés **anglais** et `tests/setup.ts` épingle `en` pour toute la suite. Un
test qui a besoin d'une autre langue la pose lui-même.

Le catalogue porte encore les clés des pages parties dans `tr4de` (trading,
patrimoine, cashflow…). Elles ne sont plus lues ; les retirer est un chantier
séparé.

### Service worker

`public/sw.js` — network-first sur les navigations, cache-first sur
`/_next/static/`, jamais de cache sur `/api/*`. Ajouter une route à `SHELL_URLS`
oblige à **incrémenter `VERSION`**, sinon les installations existantes gardent
l'ancien cache.

## Conventions d'écriture

Les commentaires de ce dépôt sont **en français** et expliquent le *pourquoi* —
la contrainte, l'alternative écartée, le piège évité — jamais le *quoi*. Les
noms de cas de test aussi (`it("coupe ce qu'une liste retient…")`). Une
contribution qui commente en anglais ou paraphrase le code détonne : suivre la
densité et le ton des fichiers voisins.
