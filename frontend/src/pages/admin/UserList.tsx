import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { userService } from "../../services/user.service";
import type { User } from "../../types/user";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

// ─── Icons ────────────────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectAllCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
    />
  );
}

// ─── Avatar con iniciales ─────────────────────────────────────────
const AVATAR_COLORS = [
  ["#C8D8C0", "#3D6040"],
  ["#D4C8E0", "#5A3D7A"],
  ["#C8D8E0", "#3D5A7A"],
  ["#E0D4C8", "#7A5A3D"],
  ["#E0C8C8", "#7A3D3D"],
];

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[idx];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  platform_admin: "Admin",
};

const ROLE_STYLES: Record<string, string> = {
  buyer: "bg-[#EAF0FA] text-[#2D4F8A]",
  seller: "bg-[#FFF3E0] text-[#A05A00]",
  platform_admin: "bg-[#F3E0FF] text-[#6A1B9A]",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_STYLES[role] ?? "bg-[#F2F2F2] text-[#6B6B6B]"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[#E6F4EA] text-[#2D6A4F]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[#F2F2F2] text-[#6B6B6B]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ABABAB]" />
      Inactivo
    </span>
  );
}

function VerifiedIcon({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <svg className="w-4 h-4 text-[#2D6A4F]" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <div className="animate-pulse divide-y divide-[#F0EDE8]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-4 h-4 bg-[#EDE9E2] rounded shrink-0" />
          <div className="w-9 h-9 bg-[#EDE9E2] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#EDE9E2] rounded w-1/4" />
            <div className="h-2.5 bg-[#F0EDE8] rounded w-1/3" />
          </div>
          <div className="h-5 w-20 bg-[#EDE9E2] rounded-full" />
          <div className="h-5 w-16 bg-[#F0EDE8] rounded-full" />
          <div className="h-4 w-4 bg-[#F0EDE8] rounded-full" />
          <div className="w-6" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-[#F0EDE8] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6B6B6B]">No se encontraron usuarios con esos filtros.</p>
          <button onClick={onReset} className="text-xs text-[#1A2B1C] underline underline-offset-2 hover:text-[#253824] transition-colors">
            Limpiar filtros
          </button>
        </>
      ) : (
        <p className="text-sm text-[#6B6B6B]">Todavía no hay usuarios registrados.</p>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const all = Array.from({ length: pages }, (_, i) => i + 1);
  let visible: (number | "...")[];
  if (pages <= 7) {
    visible = all;
  } else if (page <= 4) {
    visible = [...all.slice(0, 5), "...", pages];
  } else if (page >= pages - 3) {
    visible = [1, "...", ...all.slice(pages - 5)];
  } else {
    visible = [1, "...", page - 1, page, page + 1, "...", pages];
  }

  const btn = "rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E2D8]">
      <p className="text-xs text-[#8A8A8A]">Página {page} de {pages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className={btn}>←</button>
        {visible.map((v, i) =>
          v === "..." ? (
            <span key={`e${i}`} className="px-2 py-1.5 text-xs text-[#ABABAB]">…</span>
          ) : (
            <button
              key={v}
              onClick={() => onPage(v as number)}
              className={`rounded-lg px-2.5 py-1.5 text-xs border transition-colors ${v === page ? "bg-[#1A2B1C] text-white border-[#1A2B1C]" : "border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5]"}`}
            >
              {v}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className={btn}>→</button>
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────
function UserRow({
  user,
  selected,
  onToggle,
  onDelete,
  onToggleActive,
}: {
  user: User;
  selected: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (updated: User) => void;
}) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await userService.deleteById(user.user_id);
      toast.success(`"${user.name}" eliminado`);
      onDelete(user.user_id);
    } catch {
      toast.error("No se pudo eliminar el usuario");
      setDeleting(false);
      setConfirming(false);
    }
  }

  async function handleToggleActive() {
    setTogglingActive(true);
    try {
      const updated = await userService.toggleActive(user.user_id);
      onToggleActive(updated);
      toast.success(updated.is_active ? `"${user.name}" activado` : `"${user.name}" desactivado`);
    } catch {
      toast.error("No se pudo cambiar el estado del usuario");
    } finally {
      setTogglingActive(false);
    }
  }

  const joinDate = new Date(user.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className={`transition-colors group ${selected ? "bg-[#F4F8F4]" : "hover:bg-[#F9F8F5]"}`}>
      {/* Checkbox */}
      <td className="px-4 py-3 w-[48px]">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(user.user_id)}
          className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
        />
      </td>
      {/* Avatar */}
      <td className="px-4 py-3 w-[56px]">
        <UserAvatar name={user.name} avatarUrl={user.avatar_url} />
      </td>
      {/* Name + email */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{user.name}</p>
        <p className="text-xs text-[#ABABAB] mt-0.5">{user.email}</p>
      </td>
      {/* Role */}
      <td className="px-4 py-3 w-[120px]">
        <RoleBadge role={user.role} />
      </td>
      {/* Active */}
      <td className="px-4 py-3 w-[110px]">
        <ActiveBadge isActive={user.is_active} />
      </td>
      {/* Verified */}
      <td className="px-4 py-3 w-[80px] text-center">
        <div className="flex items-center justify-center gap-1" title={user.email_verified ? "Email verificado" : "Email sin verificar"}>
          <VerifiedIcon verified={user.email_verified} />
        </div>
      </td>
      {/* Join date */}
      <td className="px-4 py-3 w-[120px]">
        <span className="text-xs text-[#6B6B6B] whitespace-nowrap">{joinDate}</span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3 text-right w-[140px]">
        {confirming ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-[#6B6B6B] mr-1">¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-medium bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
            >
              {deleting ? "…" : "Sí"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="px-2 py-1 text-xs text-[#6B6B6B] border border-[#E8E2D8] rounded hover:bg-[#F5F5F3] transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {/* Editar */}
            <button
              onClick={() => navigate(`/seller/users/${user.user_id}/edit`)}
              className="p-1.5 text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors"
              title="Editar usuario"
            >
              <PencilIcon />
            </button>
            {/* Toggle activo */}
            <button
              onClick={handleToggleActive}
              disabled={togglingActive}
              title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
              className={`p-1.5 transition-colors disabled:opacity-40 ${user.is_active ? "text-[#6B6B6B] hover:text-[#A05A00]" : "text-[#6B6B6B] hover:text-[#2D6A4F]"}`}
            >
              {user.is_active ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="5" width="22" height="14" rx="7" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="16" cy="12" r="4" fill="currentColor" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="5" width="22" height="14" rx="7" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="12" r="4" fill="currentColor" opacity="0.4" />
                </svg>
              )}
            </button>
            {/* Eliminar */}
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
              title="Eliminar usuario"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export function UserList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setConfirmBulk(false);
  }, [debouncedQ, roleFilter, statusFilter, sort]);

  // Fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Parameters<typeof userService.list>[0] = {
      q: debouncedQ || undefined,
      role: roleFilter || undefined,
      sort,
      page,
      page_size: PAGE_SIZE,
    };
    if (statusFilter === "active") params.is_active = true;
    if (statusFilter === "inactive") params.is_active = false;

    userService
      .list(params)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          setPages(data.pages);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los usuarios. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQ, roleFilter, statusFilter, sort, page]);

  const hasFilters = !!(q || roleFilter || statusFilter || sort !== "newest");

  function handleReset() {
    setQ("");
    setRoleFilter("");
    setStatusFilter("");
    setSort("newest");
    setPage(1);
  }

  const allOnPageSelected = items.length > 0 && items.every((u) => selected.has(u.user_id));
  const someOnPageSelected = items.some((u) => selected.has(u.user_id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        items.forEach((u) => next.delete(u.user_id));
      } else {
        items.forEach((u) => next.add(u.user_id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirmBulk(false);
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => userService.deleteById(id)));

    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    const failedCount = ids.length - succeeded.length;

    setItems((prev) => prev.filter((u) => !succeeded.includes(u.user_id)));
    setTotal((t) => t - succeeded.length);
    setSelected(new Set());
    setConfirmBulk(false);
    setBulkDeleting(false);

    if (failedCount === 0) {
      toast.success(`${succeeded.length} usuario${succeeded.length !== 1 ? "s" : ""} eliminado${succeeded.length !== 1 ? "s" : ""}`);
    } else {
      toast.error(`${succeeded.length} eliminado${succeeded.length !== 1 ? "s" : ""}, ${failedCount} con error`);
    }
  }

  function handlePageChange(p: number) {
    setPage(p);
    setSelected(new Set());
    setConfirmBulk(false);
  }

  return (
    <AdminLayout>
      {/* Mobile sticky action bar */}
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <Link to="/seller/users/new" className="btn-primary w-full text-center block">
          + Nuevo usuario
        </Link>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Usuarios</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Usuarios</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading ? "Cargando..." : `${total} usuario${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Link to="/seller/users/new" className="btn-primary">
              + Nuevo usuario
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>

            {/* Role filter */}
            <div className="relative w-full sm:w-auto">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${SELECT} w-full sm:w-[160px]`}>
                <option value="">Todos los roles</option>
                <option value="buyer">Comprador</option>
                <option value="seller">Vendedor</option>
                <option value="platform_admin">Admin</option>
              </select>
              <ChevronDown />
            </div>

            {/* Status filter */}
            <div className="relative w-full sm:w-auto">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${SELECT} w-full sm:w-[160px]`}>
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown />
            </div>

            {/* Sort */}
            <div className="relative w-full sm:w-auto">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${SELECT} w-full sm:w-[170px]`}>
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="name_asc">Nombre A → Z</option>
              </select>
              <ChevronDown />
            </div>

            {hasFilters && (
              <button onClick={handleReset} className="text-xs text-[#8A8A8A] hover:text-[#1A2B1C] transition-colors underline underline-offset-2">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-[#6B6B6B]">{error}</p>
              <button onClick={() => setPage((p) => p)} className="text-xs text-[#1A2B1C] underline underline-offset-2">
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <SkeletonRows />
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={handleReset} />
          ) : (
            <>
              {/* Bulk action bar */}
              {selected.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F8F4] border-b border-[#D4E8D4]">
                  <span className="text-sm font-medium text-[#1A2B1C]">
                    {selected.size} usuario{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1" />
                  {confirmBulk ? (
                    <>
                      <span className="text-xs text-[#6B6B6B]">¿Eliminar {selected.size} usuario{selected.size !== 1 ? "s" : ""}?</span>
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                      >
                        {bulkDeleting ? "Eliminando…" : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmBulk(false)} disabled={bulkDeleting} className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-white transition-colors">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setConfirmBulk(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DC2626] border border-[#FECACA] rounded-lg hover:bg-[#FEF2F2] transition-colors">
                        <TrashIcon className="w-3.5 h-3.5" /> Eliminar seleccionados
                      </button>
                      <button onClick={clearSelection} className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-white transition-colors">
                        Cancelar selección
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <th className="w-[48px] px-4 py-3">
                      <SelectAllCheckbox
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected && !allOnPageSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="w-[56px] px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[80px]">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Registro</th>
                    <th className="w-[140px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((u) => (
                    <UserRow
                      key={u.user_id}
                      user={u}
                      selected={selected.has(u.user_id)}
                      onToggle={toggleOne}
                      onDelete={(id) => {
                        setItems((prev) => prev.filter((x) => x.user_id !== id));
                        setTotal((t) => t - 1);
                        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
                      }}
                      onToggleActive={(updated) => {
                        setItems((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
                      }}
                    />
                  ))}
                </tbody>
              </table>
              </div>

              {pages > 1 && <Pagination page={page} pages={pages} onPage={handlePageChange} />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
