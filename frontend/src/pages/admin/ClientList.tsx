import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { userService } from "../../services/user.service";
import type { User } from "../../types/user";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" viewBox="0 0 16 16" fill="none">
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

const AVATAR_COLORS = [
  ["#C8D8C0", "#3D6040"],
  ["#D4C8E0", "#5A3D7A"],
  ["#C8D8E0", "#3D5A7A"],
  ["#E0D4C8", "#7A5A3D"],
  ["#E0C8C8", "#7A3D3D"],
];

function ClientAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[idx];
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: bg, color: text }}>
      {initials || "?"}
    </div>
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

function GoogleBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#EAF0FA] text-[#2D4F8A]">
      <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Google
    </span>
  );
}

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
          <div className="h-5 w-16 bg-[#EDE9E2] rounded-full" />
          <div className="h-5 w-16 bg-[#F0EDE8] rounded-full" />
          <div className="h-3 w-24 bg-[#F0EDE8] rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-[#F0EDE8] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6B6B6B]">No se encontraron clientes con esos filtros.</p>
          <button onClick={onReset} className="text-xs text-[#1A2B1C] underline underline-offset-2 hover:text-[#253824] transition-colors">
            Limpiar filtros
          </button>
        </>
      ) : (
        <p className="text-sm text-[#6B6B6B]">Todavía no hay clientes registrados.</p>
      )}
    </div>
  );
}

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

function ClientRow({
  client,
  selected,
  onToggle,
  onToggleActive,
}: {
  client: User;
  selected: boolean;
  onToggle: (id: string) => void;
  onToggleActive: (updated: User) => void;
}) {
  const [togglingActive, setTogglingActive] = useState(false);
  const isGoogleUser = client.avatar_url !== null;

  async function handleToggleActive() {
    setTogglingActive(true);
    try {
      const updated = await userService.toggleActive(client.user_id);
      onToggleActive(updated);
      toast.success(updated.is_active ? `"${client.name}" activado` : `"${client.name}" desactivado`);
    } catch {
      toast.error("No se pudo cambiar el estado del cliente");
    } finally {
      setTogglingActive(false);
    }
  }

  const joinDate = new Date(client.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className={`transition-colors group ${selected ? "bg-[#F4F8F4]" : "hover:bg-[#F9F8F5]"}`}>
      <td className="px-4 py-3 w-[48px]">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(client.user_id)}
          className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 w-[56px]">
        <ClientAvatar name={client.name} avatarUrl={client.avatar_url} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{client.name}</p>
        <p className="text-xs text-[#ABABAB] mt-0.5">{client.email}</p>
      </td>
      <td className="px-4 py-3 w-[100px]">
        {isGoogleUser && <GoogleBadge />}
      </td>
      <td className="px-4 py-3 w-[110px]">
        <ActiveBadge isActive={client.is_active} />
      </td>
      <td className="px-4 py-3 w-[120px]">
        <span className="text-xs text-[#6B6B6B] whitespace-nowrap">{joinDate}</span>
      </td>
      <td className="px-4 py-3 text-right w-[80px]">
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleActive}
            disabled={togglingActive}
            title={client.is_active ? "Desactivar cliente" : "Activar cliente"}
            className={`p-1.5 transition-colors disabled:opacity-40 ${client.is_active ? "text-[#6B6B6B] hover:text-[#A05A00]" : "text-[#6B6B6B] hover:text-[#2D6A4F]"}`}
          >
            {client.is_active ? (
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
        </div>
      </td>
    </tr>
  );
}

export function ClientList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedQ, statusFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Parameters<typeof userService.list>[0] = {
      role: "buyer",
      q: debouncedQ || undefined,
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
          setError("No se pudieron cargar los clientes. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQ, statusFilter, sort, page]);

  const hasFilters = !!(q || statusFilter || sort !== "newest");

  function handleReset() {
    setQ("");
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

  return (
    <AdminLayout>
      <div className="px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Clientes</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Clientes</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading ? "Cargando..." : `${total} cliente${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${SELECT} w-[160px]`}>
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown />
            </div>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${SELECT} w-[170px]`}>
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
              {selected.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F8F4] border-b border-[#D4E8D4]">
                  <span className="text-sm font-medium text-[#1A2B1C]">
                    {selected.size} cliente{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
                  </span>
                  <button onClick={() => setSelected(new Set())} className="ml-auto px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-white transition-colors">
                    Cancelar selección
                  </button>
                </div>
              )}

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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[100px]">Auth</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Registro</th>
                    <th className="w-[80px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((c) => (
                    <ClientRow
                      key={c.user_id}
                      client={c}
                      selected={selected.has(c.user_id)}
                      onToggle={toggleOne}
                      onToggleActive={(updated) => {
                        setItems((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
                      }}
                    />
                  ))}
                </tbody>
              </table>

              {pages > 1 && <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); setSelected(new Set()); }} />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
