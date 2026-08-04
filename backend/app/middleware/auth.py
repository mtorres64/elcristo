from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.utils.security import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.current_user = None
        request.state.current_user_role = None

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ")
            payload = decode_access_token(token)
            if payload:
                request.state.current_user = payload
                request.state.current_user_role = payload.get("role")

        return await call_next(request)
