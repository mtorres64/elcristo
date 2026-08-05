import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";

const GOOGLE_CONFIGURED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface FormData {
  email: string;
  password: string;
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

function GoogleLoginButton({
  disabled,
  onBefore,
  onSuccess,
  onError,
}: {
  disabled: boolean;
  onBefore: () => void;
  onSuccess: (accessToken: string) => void;
  onError: () => void;
}) {
  const googleLogin = useGoogleLogin({
    onSuccess: (res) => onSuccess(res.access_token),
    onError,
  });
  return (
    <button
      type="button"
      onClick={() => { onBefore(); googleLogin(); }}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 border border-[#E8E2D8] bg-white py-3 px-4 text-sm text-[#1A1A1A] hover:bg-[#F8F7F5] transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <GoogleIcon />
      Continuar con Google
    </button>
  );
}

function LeafDecoration() {
  return (
    <svg viewBox="0 0 400 500" fill="none" className="w-full h-full opacity-10">
      <path d="M200 50 C100 100 50 200 100 350 C150 450 250 480 300 400 C350 320 380 200 300 100 C260 50 230 30 200 50Z" fill="white"/>
      <path d="M200 50 L200 420" stroke="white" strokeWidth="2"/>
      <path d="M200 150 C160 130 130 160 120 200" stroke="white" strokeWidth="1.5"/>
      <path d="M200 220 C240 200 270 220 280 260" stroke="white" strokeWidth="1.5"/>
      <path d="M200 290 C160 270 140 300 130 330" stroke="white" strokeWidth="1.5"/>
      <path d="M150 50 C80 80 40 160 60 280 C80 360 140 420 200 420" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>
      <path d="M250 50 C320 80 360 160 340 280 C320 360 260 420 200 420" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>
    </svg>
  );
}

export function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  function redirectAfterLogin(role: string) {
    if (role === "platform_admin" || role === "seller") {
      navigate("/seller/products", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success("¡Bienvenido de nuevo!");
      redirectAfterLogin(user.role);
    } catch {
      toast.error("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(accessToken: string) {
    try {
      const user = await loginWithGoogle(accessToken);
      toast.success("¡Bienvenido!");
      redirectAfterLogin(user.role);
    } catch {
      toast.error("No se pudo iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-5/12 bg-forest-deep flex-col items-center justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <LeafDecoration />
        </div>
        <Link to="/" className="relative z-10 text-white text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">
          ← Volver a la tienda
        </Link>
        <div className="relative z-10 text-center">
          <h2 className="font-serif text-4xl text-white mb-4 leading-snug">
            Tu espacio verde,<br />a un clic.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Accede a tu cuenta para gestionar pedidos, guardar favoritos y explorar nuestra colección.
          </p>
        </div>
        <div className="relative z-10 flex gap-1">
          <span className="w-8 h-0.5 bg-white/40 rounded-full" />
          <span className="w-8 h-0.5 bg-white rounded-full" />
          <span className="w-8 h-0.5 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#6B6B6B] hover:text-forest-deep transition-colors mb-8">
            ← Volver
          </Link>

          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">
            ¿Eres nuevo?{" "}
            <Link to="/register" className="text-forest-accent hover:underline font-medium">
              Crea una cuenta
            </Link>
          </p>

          {/* Botones sociales */}
          <div className="space-y-3 mb-6">
            {GOOGLE_CONFIGURED ? (
              <GoogleLoginButton
                disabled={loading}
                onBefore={() => setLoading(true)}
                onSuccess={handleGoogleSuccess}
                onError={() => { toast.error("Error al conectar con Google"); setLoading(false); }}
              />
            ) : (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 border border-[#E8E2D8] bg-white py-3 px-4 text-sm text-[#1A1A1A] rounded-lg opacity-40 cursor-not-allowed"
                title="Configurá VITE_GOOGLE_CLIENT_ID para habilitar"
              >
                <GoogleIcon />
                Continuar con Google
              </button>
            )}
            <button
              type="button"
              onClick={() => toast("Inicio de sesión con Facebook próximamente", { icon: "🚧" })}
              className="w-full flex items-center justify-center gap-3 border border-[#E8E2D8] bg-white py-3 px-4 text-sm text-[#1A1A1A] hover:bg-[#F8F7F5] transition-colors rounded-lg"
            >
              <FacebookIcon />
              Continuar con Facebook
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-[#E8E2D8]" />
            <span className="text-[10px] text-[#ABABAB] uppercase tracking-widest">o con email</span>
            <hr className="flex-1 border-[#E8E2D8]" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className={`w-full border ${errors.email ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors rounded-lg`}
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A]">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-forest-accent hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full border ${errors.password ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 pr-11 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors rounded-lg`}
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-xs text-[#ABABAB] mt-8 leading-relaxed">
            Al continuar, aceptas nuestros{" "}
            <span className="underline cursor-pointer hover:text-[#6B6B6B]">Términos de uso</span>{" "}
            y{" "}
            <span className="underline cursor-pointer hover:text-[#6B6B6B]">Política de privacidad</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
