import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { userService } from "../../services/user.service";
import type { User } from "../../types/user";
import toast from "react-hot-toast";

const INPUT =
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors rounded-lg";

const LABEL = "text-xs font-medium text-[#6B6B6B]";

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`${LABEL} block mb-1.5`}>
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#DC2626] mt-1">{error}</p>}
      {!error && hint && <p className="text-[10px] text-[#ABABAB] mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#1A2B1C]" : "bg-[#D0D0D0]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const ROLE_OPTIONS = [
  { value: "buyer", label: "Comprador", desc: "Puede comprar productos" },
  { value: "seller", label: "Vendedor", desc: "Gestiona su tienda" },
  { value: "platform_admin", label: "Administrador", desc: "Acceso completo" },
] as const;

const AVATAR_COLORS = [
  ["#C8D8C0", "#3D6040"],
  ["#D4C8E0", "#5A3D7A"],
  ["#C8D8E0", "#3D5A7A"],
  ["#E0D4C8", "#7A5A3D"],
  ["#E0C8C8", "#7A3D3D"],
];

function UserAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[idx];
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ backgroundColor: bg, color: text, width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
}

export function UserEdit() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [original, setOriginal] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | "platform_admin">("buyer");
  const [isActive, setIsActive] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    userService
      .getById(userId)
      .then((u) => {
        setOriginal(u);
        setName(u.name);
        setEmail(u.email);
        setRole(u.role);
        setIsActive(u.is_active);
        setLoadingData(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoadingData(false);
      });
  }, [userId]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (newPassword && newPassword.length < 8) e.newPassword = "Mínimo 8 caracteres";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), email: email.trim(), role, is_active: isActive };
      if (newPassword) payload.password = newPassword;
      await userService.updateById(userId!, payload);
      toast.success("Usuario actualizado");
      navigate("/seller/users");
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "No se pudo guardar los cambios");
      setSaving(false);
    }
  }

  // ─── Loading skeleton ─────────────────────────────────────────
  if (loadingData) {
    return (
      <AdminLayout>
        <div className="px-8 py-6 min-h-full animate-pulse">
          <div className="h-3 bg-[#EDE9E2] rounded w-40 mb-4" />
          <div className="h-7 bg-[#EDE9E2] rounded w-56 mb-2" />
          <div className="h-3 bg-[#F0EDE8] rounded w-32 mb-8" />
          <div className="flex gap-6">
            <div className="flex-1 bg-[#EDE9E2] rounded-lg h-80" />
            <div className="w-[280px] bg-[#EDE9E2] rounded-lg h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (fetchError) {
    return (
      <AdminLayout>
        <div className="px-8 py-6 min-h-full flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-[#6B6B6B]">No se pudo cargar el usuario.</p>
          <Link to="/seller/users" className="text-xs text-[#1A2B1C] underline underline-offset-2">
            Volver a usuarios
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Mobile action bar */}
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
        <Link
          to="/seller/users"
          className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller/users" className="hover:text-[#1A2B1C] transition-colors">Usuarios</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-[#1A1A1A] font-medium">{name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar name={name} size={48} />
            <div>
              <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">{name}</h1>
              <p className="text-xs text-[#8A8A8A] mt-0.5">{original?.email}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              to="/seller/users"
              className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* Left */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Datos principales */}
            <div className="bg-white border border-[#E8E2D8] p-6 flex flex-col gap-6">
              <FormField label="Nombre completo" required error={errors.name}>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                  maxLength={100}
                  placeholder="Nombre completo"
                  className={`${INPUT} ${errors.name ? "border-[#DC2626]" : ""}`}
                />
              </FormField>

              <FormField label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="usuario@ejemplo.com"
                  className={`${INPUT} ${errors.email ? "border-[#DC2626]" : ""}`}
                />
              </FormField>

              {/* Rol */}
              <FormField label="Rol" required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex flex-col gap-1 border p-3 cursor-pointer transition-colors rounded-lg ${
                        role === value ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#A0B8A0]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={role === value}
                        onChange={() => setRole(value)}
                        className="sr-only"
                      />
                      <span className="text-xs font-semibold text-[#1A1A1A]">{label}</span>
                      <span className="text-[10px] text-[#8A8A8A] leading-tight">{desc}</span>
                    </label>
                  ))}
                </div>
              </FormField>

              {/* Estado */}
              <div>
                <p className={`${LABEL} mb-1.5`}>Estado</p>
                <div className="flex items-center gap-2">
                  <Toggle checked={isActive} onChange={setIsActive} />
                  <span className="text-sm text-[#4A4A4A]">{isActive ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="bg-white border border-[#E8E2D8] p-6">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Cambiar contraseña</p>
              <p className="text-[11px] text-[#8A8A8A] mb-4">Dejalo vacío para mantener la contraseña actual.</p>
              <FormField label="Nueva contraseña" error={errors.newPassword} hint="Mínimo 8 caracteres.">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: "" })); }}
                    placeholder="••••••••"
                    className={`${INPUT} pr-10 ${errors.newPassword ? "border-[#DC2626]" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#6B6B6B] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </FormField>
            </div>
          </div>

          {/* Right — info */}
          <div className="w-full lg:w-[280px] shrink-0">
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Información</p>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Email verificado</span>
                  <span className={original?.email_verified ? "text-[#2D6A4F] font-medium" : "text-[#ABABAB]"}>
                    {original?.email_verified ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">ID</span>
                  <span className="text-[#ABABAB] font-mono text-[10px] truncate max-w-[120px]">{userId}</span>
                </div>
                <hr className="border-[#F0EDE8]" />
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Registro</span>
                  <span className="text-[#1A1A1A]">{original?.created_at ? formatDate(original.created_at) : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
