from fastapi import HTTPException, Request


def require_user(request: Request) -> dict:
    """Devuelve el payload del JWT actual o levanta 401 si no hay sesión.

    Sigue el mismo patrón manual que ya usa `auth.me` (lee
    `request.state.current_user`, poblado por `AuthMiddleware`) en vez de
    introducir un esquema de seguridad de FastAPI nuevo.
    """
    user = request.state.current_user
    if not user:
        raise HTTPException(401, "No autenticado")
    return user


def require_user_id(request: Request) -> str:
    user = require_user(request)
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(401, "Token inválido")
    return user_id
