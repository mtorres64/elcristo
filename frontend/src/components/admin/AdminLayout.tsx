import { useState, useRef, useEffect, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface NavItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
}

const NAV: NavItem[] = [
  { icon: <DashboardIcon />, label: "Dashboard", path: "/seller" },
  { icon: <OrdersIcon />, label: "Pedidos", path: "/seller/orders", badge: 12 },
  { icon: <ProductsIcon />, label: "Productos", path: "/seller/products" },
  { icon: <CategoriesIcon />, label: "Categorías", path: "/seller/categories" },
  { icon: <ClientsIcon />, label: "Clientes", path: "/seller/clients" },
  { icon: <DiscountsIcon />, label: "Descuentos", path: "/seller/discounts" },
  { icon: <ContentIcon />, label: "Contenido", path: "/seller/content" },
  { icon: <ReportsIcon />, label: "Reportes", path: "/seller/reports" },
  { icon: <SettingsIcon />, label: "Configuración", path: "/seller/settings" },
  { icon: <UsersAdminIcon />, label: "Usuarios", path: "/seller/users" },
  { icon: <IntegrationsIcon />, label: "Integraciones", path: "/seller/integrations" },
];

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "Administrador",
  seller: "Vendedor",
  buyer: "Comprador",
};

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "?";
  const displayName = user?.name ?? "Usuario";
  const displayRole = ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "";

  return (
    <div className="min-h-screen flex bg-[#F5F5F3] font-sans">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-[240px]" : "w-0"} bg-[#111810] flex flex-col shrink-0 overflow-hidden transition-[width] duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[60px] border-b border-[#1C2C1C] shrink-0">
          <LotusIcon className="w-8 h-8 text-white shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-[10px] font-bold tracking-widest leading-tight whitespace-nowrap">
              VERDE DISEÑO
            </p>
            <p className="text-[#7A9B7C] text-[9px] uppercase tracking-widest whitespace-nowrap">
              Administración
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map((item) => {
            const isActive =
              item.path === "/seller"
                ? location.pathname === "/seller"
                : location.pathname.startsWith(item.path);

            return (
              <div key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#1A2B1C] text-white"
                      : "text-[#8AAB8C] hover:bg-[#1A2B1C] hover:text-white"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#5A7A5C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#1C2C1C] px-5 py-4 shrink-0">
          <div className="mb-3">
            <p className="text-[#7A9B7C] text-[11px] font-semibold leading-tight">
              ¿Necesitás ayuda?
            </p>
            <a
              href="#"
              className="text-[#5A7A5C] text-[10px] hover:text-[#A0C8A0] transition-colors"
            >
              Centro de ayuda
            </a>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#5A7A5C] hover:text-white text-xs font-medium transition-colors"
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-[#E8E2D8] h-[60px] flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors shrink-0"
            aria-label="Toggle menú"
          >
            <HamburgerIcon />
          </button>

          <div className="flex items-center gap-5 ml-auto">
            {/* Bell */}
            <button
              className="relative text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
              aria-label="Notificaciones"
            >
              <BellIcon />
              <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                2
              </span>
            </button>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-[#1A2B1C] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <p className="text-xs font-semibold text-[#1A1A1A]">{displayName}</p>
                  <p className="text-[10px] text-[#8A8A8A]">{displayRole}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[#8A8A8A] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E8E2D8] shadow-lg z-50 py-1">
                  <div className="px-4 py-2.5 border-b border-[#F0EDE8]">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#8A8A8A] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <LogoutIcon />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────────── */

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="currentColor">
      <path d="M24 42 C22 33 20 23 24 8 C28 23 26 33 24 42Z" />
      <path d="M24 42 C19 34 11 24 9 12 C17 22 22 33 24 42Z" />
      <path d="M24 42 C29 34 37 24 39 12 C31 22 26 33 24 42Z" />
      <path d="M22 40 C16 34 5 30 2 19 C10 26 17 34 22 40Z" opacity="0.65" />
      <path d="M26 40 C32 34 43 30 46 19 C38 26 31 34 26 40Z" opacity="0.65" />
    </svg>
  );
}

function icon(d: string) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}
function ProductsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function CategoriesIcon() { return icon("M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"); }
function ClientsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function DiscountsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function ContentIcon() { return icon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"); }
function ReportsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function UsersAdminIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IntegrationsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
