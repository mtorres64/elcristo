import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { userService } from "../../services/user.service";
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

const ROLE_OPTIONS = [
  { value: "buyer", label: "Comprador", desc: "Puede comprar productos en la tienda" },
  { value: "seller", label: "Vendedor", desc: "Puede gestionar su tienda y productos" },
  { value: "platform_admin", label: "Administrador", desc: "Acceso completo a la plataforma" },
] as const;

export function UserNew() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"buyer" | "seller" | "platform_admin">("buyer");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "La contraseña es obligatoria";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await userService.create({ name: name.trim(), email: email.trim(), password, role, is_active: isActive });
      toast.success(`"${name.trim()}" creado`);
      navigate("/seller/users");
    } catch (err: unknown) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "No se pudo crear el usuario");
      setSaving(false);
    }
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
          {saving ? "Guardando…" : "Guardar usuario"}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller/users" className="hover:text-[#1A2B1C] transition-colors">
            Usuarios
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-[#1A1A1A] font-medium">Nuevo usuario</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Nuevo usuario
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">Creá una cuenta de usuario manualmente</p>
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
              {saving ? "Guardando…" : "Guardar usuario"}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* Left — datos principales */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-[#E8E2D8] p-6 flex flex-col gap-6">
              {/* Nombre */}
              <FormField label="Nombre completo" required error={errors.name}>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                  maxLength={100}
                  placeholder="Ej: María García"
                  className={`${INPUT} ${errors.name ? "border-[#DC2626]" : ""}`}
                />
              </FormField>

              {/* Email */}
              <FormField label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="maria@ejemplo.com"
                  className={`${INPUT} ${errors.email ? "border-[#DC2626]" : ""}`}
                />
              </FormField>

              {/* Contraseña */}
              <FormField
                label="Contraseña"
                required
                hint="Mínimo 8 caracteres."
                error={errors.password}
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                    placeholder="••••••••"
                    className={`${INPUT} pr-10 ${errors.password ? "border-[#DC2626]" : ""}`}
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

              {/* Rol */}
              <FormField label="Rol" required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex flex-col gap-1 border p-3 cursor-pointer transition-colors rounded-lg ${
                        role === value
                          ? "border-[#1A2B1C] bg-[#F4F8F4]"
                          : "border-[#E8E2D8] hover:border-[#A0B8A0]"
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
          </div>

          {/* Right — info */}
          <div className="w-full lg:w-[280px] shrink-0">
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Información</p>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Email verificado</span>
                  <span className="text-[#ABABAB]">No (por defecto)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Creado</span>
                  <span className="text-[#ABABAB]">Al guardar</span>
                </div>
              </div>
              <hr className="my-4 border-[#F0EDE8]" />
              <p className="text-[10px] text-[#ABABAB] leading-relaxed">
                El usuario podrá cambiar su contraseña desde su perfil una vez que inicie sesión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
