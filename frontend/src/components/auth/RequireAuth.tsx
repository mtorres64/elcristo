import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/** Redirige a /login si no hay sesión activa. Sin esto, cualquiera con la
 * URL puede abrir las páginas de /seller aunque el fetch de datos falle:
 * varios GET del backend (ej. productos) son públicos, así que la página
 * "carga" igual y solo las acciones que requieren auth tiran 401. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return children;
}
