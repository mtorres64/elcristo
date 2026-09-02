import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../services/auth.service";

type Status = "verifying" | "success" | "error";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("El enlace no es válido: falta el token de confirmación.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        const detail =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
        setStatus("error");
        setMessage(
          typeof detail === "string"
            ? detail
            : "No se pudo confirmar tu correo. El enlace puede haber expirado."
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="w-14 h-14 border-2 border-forest-deep border-t-transparent rounded-full animate-spin mx-auto mb-8" />
            <h1 className="font-serif text-2xl text-[#1A1A1A] mb-2">Confirmando tu correo…</h1>
            <p className="text-sm text-[#6B6B6B]">Esto tomará solo un momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">¡Correo confirmado!</h1>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">{message}</p>
            <Link to="/login" className="btn-primary inline-block px-8 py-3">
              Iniciar sesión
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-[#FDECEC] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">No pudimos confirmar tu correo</h1>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">{message}</p>
            <Link to="/login" className="btn-outline inline-block px-8 py-3 text-xs">
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
