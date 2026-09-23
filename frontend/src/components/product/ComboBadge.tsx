/** Etiqueta "COMBO" para las tarjetas de producto de la tienda — mismo
 * verde oscuro que el menú lateral del admin (forest.dark, #111810), como
 * una bandera que sobresale del borde izquierdo de la tarjeta (esquinas
 * redondeadas solo a la derecha). Se ubica FUERA del contenedor de la
 * imagen (que tiene overflow-hidden) — si no, ese overflow-hidden recorta
 * la parte que sobresale. */
export function ComboBadge() {
  return (
    <span className="absolute top-3 -left-[10px] z-10 flex items-center gap-1.5 bg-forest-dark text-white text-[13px] font-bold uppercase tracking-wider pl-4 pr-4 pt-[7px] pb-[5px] rounded-r-full shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]">
      <ComboIcon />
      Combo
    </span>
  );
}

/** Mismo ícono de regalo que el ítem "Combos" del menú del admin
 * (AdminLayout.tsx) — refuerza la misma identidad visual en la tienda. */
function ComboIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 relative -top-px">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
