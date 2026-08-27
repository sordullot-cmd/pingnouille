"use client";

/**
 * Barre d'onglets horizontale. Aucun écran ne la monte aujourd'hui — elle
 * précède la coquille de `DashboardNew` —, mais elle portait encore six
 * couleurs écrites en dur (#6366F1, #0F0F1A, #E8E9EF…) qui n'appartiennent à
 * aucune palette de l'app et ne suivaient donc pas le thème sombre. Elle est
 * ramenée sur les tokens et sur la mécanique de la DA : rayon 12, cible de 44,
 * item actif à l'aplat de l'accent. Aucune arête — une barre de navigation est
 * une surface, pas un objet posé.
 */
export default function Navigation({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: "dashboard", label: "Tableau de bord" },
  ];

  return (
    <nav className="nav-bar">
      <style>{`
        .nav-bar {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: var(--color-card-bg);
          border-bottom: 2px solid var(--color-border);
          flex-wrap: wrap;
          align-items: center;
        }

        .nav-item {
          min-height: 44px;
          padding: 12px 16px;
          border-radius: var(--radius-card);
          background: transparent;
          color: var(--color-nav-text);
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: var(--fw-medium);
          font-size: var(--text-callout);
          transition: var(--tr-ui);
          white-space: nowrap;
        }

        .nav-item:hover {
          background: var(--color-nav-hover-bg);
          color: var(--color-text);
        }

        .nav-item.active {
          background: var(--color-nav-active-bg);
          color: var(--color-nav-active-text);
        }
      `}</style>

      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentPage === item.id ? "active" : ""}`}
          aria-current={currentPage === item.id ? "page" : undefined}
          onClick={() => setCurrentPage(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
