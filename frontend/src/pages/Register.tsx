import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authService } from "../services/auth.service";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

export function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const password = watch("password");

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setSentTo(data.email);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof msg === "string" ? msg : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setResending(true);
    try {
      const res = await authService.resendVerification(sentTo);
      toast.success(res.message);
    } catch {
      toast.error("No se pudo reenviar el correo. Intentá de nuevo.");
    } finally {
      setResending(false);
    }
  }

  function handleSocialLogin(provider: string) {
    toast("Registro con " + provider + " próximamente", { icon: "🚧" });
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-5/12 bg-forest-mid flex-col items-center justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 400 600" className="w-full h-full" fill="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse
                key={i}
                cx={200 + i * 10}
                cy={300 - i * 60}
                rx={80 - i * 10}
                ry={150 - i * 20}
                stroke="white"
                strokeWidth="1"
                transform={`rotate(${i * 15} 200 300)`}
              />
            ))}
          </svg>
        </div>
        <Link to="/" className="relative z-10 text-white text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">
          ← Volver a la tienda
        </Link>
        <div className="relative z-10 text-center">
          <h2 className="font-serif text-4xl text-white mb-4 leading-snug">
            Empieza tu<br />jardín hoy.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Crea tu cuenta gratuita y descubre plantas, accesorios y asesoría personalizada para tu espacio.
          </p>
        </div>
        <div className="relative z-10 flex gap-1">
          <span className="w-8 h-0.5 bg-white rounded-full" />
          <span className="w-8 h-0.5 bg-white/40 rounded-full" />
          <span className="w-8 h-0.5 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#6B6B6B] hover:text-forest-deep transition-colors mb-8">
            ← Volver
          </Link>

          {sentTo ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">Revisá tu correo</h1>
              <p className="text-sm text-[#6B6B6B] leading-relaxed mb-1">
                Te enviamos un enlace de confirmación a
              </p>
              <p className="text-sm font-medium text-[#1A1A1A] mb-6">{sentTo}</p>
              <p className="text-xs text-[#ABABAB] leading-relaxed mb-8">
                Hacé clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisá la
                carpeta de spam. El enlace vence en 24 horas.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="btn-outline text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Reenviando…" : "Reenviar correo"}
              </button>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="text-xs text-[#6B6B6B] hover:text-forest-deep transition-colors uppercase tracking-widest"
                >
                  Ir a iniciar sesión
                </Link>
              </div>
            </div>
          ) : (
          <>
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Crear cuenta</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-forest-accent hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>

          {/* Botones sociales */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="w-full flex items-center justify-center gap-3 border border-[#E8E2D8] bg-white py-3 px-4 text-sm text-[#1A1A1A] hover:bg-[#F8F7F5] transition-colors"
            >
              <GoogleIcon />
              Registrarse con Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("Facebook")}
              className="w-full flex items-center justify-center gap-3 border border-[#E8E2D8] bg-white py-3 px-4 text-sm text-[#1A1A1A] hover:bg-[#F8F7F5] transition-colors"
            >
              <FacebookIcon />
              Registrarse con Facebook
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-[#E8E2D8]" />
            <span className="text-[10px] text-[#ABABAB] uppercase tracking-widest">o con email</span>
            <hr className="flex-1 border-[#E8E2D8]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
                className={`w-full border ${errors.name ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors`}
                {...register("name", { required: "El nombre es obligatorio" })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className={`w-full border ${errors.email ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors`}
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full border ${errors.password ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 pr-11 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors`}
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#6B6B6B] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                className={`w-full border ${errors.confirmPassword ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors`}
                {...register("confirmPassword", {
                  required: "Confirma tu contraseña",
                  validate: (value) => value === password || "Las contraseñas no coinciden",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-xs text-[#ABABAB] mt-6 leading-relaxed">
            Al registrarte, aceptas nuestros{" "}
            <span className="underline cursor-pointer hover:text-[#6B6B6B]">Términos de uso</span>{" "}
            y{" "}
            <span className="underline cursor-pointer hover:text-[#6B6B6B]">Política de privacidad</span>.
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
