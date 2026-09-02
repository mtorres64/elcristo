import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authService } from "../services/auth.service";

interface FormData {
  password: string;
  confirmPassword: string;
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const password = watch("password");

  async function onSubmit(data: FormData) {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authService.resetPassword(token, data.password);
      toast.success(res.message);
      navigate("/login");
    } catch (err: unknown) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="w-14 h-14 bg-forest-light rounded-full flex items-center justify-center mb-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#253824" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {!token ? (
          <>
            <h1 className="font-serif text-3xl text-[#1A1A1A] mb-2">Enlace inválido</h1>
            <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
              Este enlace para restablecer la contraseña no es válido o está incompleto. Pedí uno
              nuevo desde la pantalla de recuperación.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-block px-8 py-3">
              Pedir un enlace nuevo
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-[#1A1A1A] mb-2">Nueva contraseña</h1>
            <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
              Elegí una contraseña nueva para tu cuenta.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repetí tu contraseña"
                  className={`w-full border ${errors.confirmPassword ? "border-red-400" : "border-[#E8E2D8]"} bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-forest-deep transition-colors`}
                  {...register("confirmPassword", {
                    required: "Confirmá tu contraseña",
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
                className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando…" : "Cambiar contraseña"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link to="/login" className="text-xs text-[#6B6B6B] hover:text-forest-deep transition-colors uppercase tracking-widest">
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
