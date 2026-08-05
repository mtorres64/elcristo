import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchTerm("");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    closeSearch();
    navigate(`/products?q=${encodeURIComponent(q)}`);
  }

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  }

  // Cierra el menú de usuario al hacer click fuera
  function handleUserMenuBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!userMenuRef.current?.contains(e.relatedTarget as Node)) {
      setUserMenuOpen(false);
    }
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "";

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
          <button
            onClick={openSearch}
            className="text-[#1A2B1C] hover:text-forest-accent transition-colors"
            aria-label="Buscar"
          >
            <SearchIcon />
          </button>

          {/* Usuario: logueado → nombre + menú | no logueado → icono login */}
          {user ? (
            <div
              ref={userMenuRef}
              className="relative"
              onBlur={handleUserMenuBlur}
            >
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-[#1A2B1C] hover:text-forest-accent transition-colors"
                aria-label="Mi cuenta"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1A2B1C] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-widest">
                  {firstName}
                </span>
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E8E2D8] shadow-lg z-50 py-1">
                  <div className="px-4 py-2.5 border-b border-[#F0EDE8]">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#8A8A8A] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="text-[#1A2B1C] hover:text-forest-accent transition-colors"
              aria-label="Mi cuenta"
            >
              <UserIcon />
            </Link>
          )}

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

      {/* Search overlay */}
      {searchOpen && (
        <div className="border-t border-[#E8E2D8] bg-white px-6 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-screen-xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar plantas, macetas, accesorios..."
                className="w-full pl-9 pr-4 py-2 border border-[#E8E2D8] rounded-lg text-sm text-[#1A1A1A] placeholder-[#ABABAB] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={closeSearch}
              className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
              aria-label="Cerrar búsqueda"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>
        </div>
      )}

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
          {user ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="text-sm text-left py-2 text-[#DC2626] tracking-wide"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-left py-2 text-[#1A1A1A] tracking-wide"
            >
              Iniciar sesión
            </Link>
          )}
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
      <path d="M24 42 C22 33 20 23 24 8 C28 23 26 33 24 42Z" />
      <path d="M24 42 C19 34 11 24 9 12 C17 22 22 33 24 42Z" />
      <path d="M24 42 C29 34 37 24 39 12 C31 22 26 33 24 42Z" />
      <path d="M22 40 C16 34 5 30 2 19 C10 26 17 34 22 40Z" opacity="0.65" />
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
