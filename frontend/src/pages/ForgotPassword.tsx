import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
}

export function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      // TODO: conectar con POST /auth/forgot-password cuando el backend lo implemente
      await new Promise((r) => setTimeout(r, 800));
      setSentEmail(data.email);
      setSubmitted(true);
    } catch {
      toast.error("No se pudo enviar el email. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Ícono */}
        <div className="w-14 h-14 bg-forest-light rounded-full flex items-center justify-center mb-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#253824" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 7l10 7 10-7"/>
          </svg>
        </div>

        {!submitted ? (
          <>
            <h1 className="font-serif text-3xl text-[#1A1A1A] mb-2">Recuperar contraseña</h1>
            <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ABABAB" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <Link to="/login" className="text-xs text-[#6B6B6B] hover:text-forest-deep transition-colors uppercase tracking-widest">
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        ) : (
          /* Estado: email enviado */
          <div className="text-center">
            <div className="w-16 h-16 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-[#1A1A1A] mb-3">Revisa tu email</h2>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-2">
              Enviamos un enlace de recuperación a
            </p>
            <p className="text-sm font-medium text-[#1A1A1A] mb-8">{sentEmail}</p>
            <p className="text-xs text-[#ABABAB] leading-relaxed mb-8">
              Si no lo ves en tu bandeja de entrada, revisa la carpeta de spam o correo no deseado.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="btn-outline text-xs"
            >
              Usar otro email
            </button>
            <div className="mt-6">
              <Link to="/login" className="text-xs text-[#6B6B6B] hover:text-forest-deep transition-colors uppercase tracking-widest">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
