import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#E8E2D8] sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <LotusIcon className="w-9 h-9 text-[#1A2B1C]" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] tracking-widest uppercase text-[#6B6B6B] font-medium">Vivero</span>
            <span className="text-sm tracking-widest uppercase text-[#1A2B1C] font-bold">El Cristo</span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-7">
          <NavLink to="/products" hasArrow>Plantas</NavLink>
          <NavLink to="/diseno">Diseño & Paisajismo</NavLink>
          <NavLink to="/macetas">Macetas & Accesorios</NavLink>
          <NavLink to="/inspiracion">Inspiración</NavLink>
          <NavLink to="/nosotros">Sobre Nosotros</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="text-[#1A2B1C] hover:text-forest-accent transition-colors" aria-label="Buscar">
            <SearchIcon />
          </button>
          <button className="text-[#1A2B1C] hover:text-forest-accent transition-colors" aria-label="Mi cuenta">
            <UserIcon />
          </button>
          <Link to="/cart" className="relative text-[#1A2B1C] hover:text-forest-accent transition-colors" aria-label="Carrito">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-forest-deep text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Hamburger mobile */}
          <button
            className="lg:hidden text-[#1A2B1C] ml-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen
                ? <path d="M18 6L6 18M6 6l12 12" />
                : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E8E2D8] px-6 py-4 flex flex-col gap-3">
          {["Plantas", "Diseño & Paisajismo", "Macetas & Accesorios", "Inspiración", "Sobre Nosotros"].map((item) => (
            <button
              key={item}
              className="text-sm text-left py-2 border-b border-[#F0EBE3] text-[#1A1A1A] tracking-wide"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children, hasArrow }: { to: string; children: React.ReactNode; hasArrow?: boolean }) {
  return (
    <Link
      to={to}
      className="text-[11px] uppercase tracking-widest text-[#1A1A1A] font-medium hover:text-forest-accent transition-colors flex items-center gap-1"
    >
      {children}
      {hasArrow && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
    </Link>
  );
}

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Center petal */}
      <path d="M24 42 C22 33 20 23 24 8 C28 23 26 33 24 42Z" />
      {/* Left mid petal */}
      <path d="M24 42 C19 34 11 24 9 12 C17 22 22 33 24 42Z" />
      {/* Right mid petal */}
      <path d="M24 42 C29 34 37 24 39 12 C31 22 26 33 24 42Z" />
      {/* Far left petal */}
      <path d="M22 40 C16 34 5 30 2 19 C10 26 17 34 22 40Z" opacity="0.65" />
      {/* Far right petal */}
      <path d="M26 40 C32 34 43 30 46 19 C38 26 31 34 26 40Z" opacity="0.65" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
