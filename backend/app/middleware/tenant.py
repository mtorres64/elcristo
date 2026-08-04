from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import settings

# Endpoints que no requieren tenant (globales o de auth)
_TENANT_FREE_PATHS = {
    "/health",
    "/auth/register",
    "/auth/login",
    "/auth/refresh",
    "/auth/me",
    "/categories",
    "/search",
    "/tenants",
}


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.tenant_id = None

        # 1. Header explícito del seller dashboard
        tenant_id = request.headers.get("X-Tenant-ID")

        # 2. Subdominio: tenant-slug.tienda.com
        if not tenant_id:
            host = request.headers.get("host", "")
            domain = settings.platform_domain
            if host.endswith(f".{domain}"):
                tenant_id = host.removesuffix(f".{domain}").split(":")[0]

        # 3. Claim JWT del seller (ya parseado por AuthMiddleware)
        if not tenant_id and request.state.current_user:
            tenant_id = request.state.current_user.get("tenant_id")

        if tenant_id:
            request.state.tenant_id = tenant_id

        return await call_next(request)
