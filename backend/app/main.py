from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_db, disconnect_db
from app.middleware.auth import AuthMiddleware
from app.middleware.tenant import TenantMiddleware
from app.routers import (
    addresses,
    auth,
    cart,
    categories,
    content,
    integrations,
    orders,
    payment_methods,
    products,
    search,
    tenants,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Tienda API",
    version="0.1.0",
    lifespan=lifespan,
)

# Orden de middlewares es crítico: CORS → Auth → Tenant → Routers
# En Starlette, el ÚLTIMO add_middleware es el más externo (primero en ejecutarse).
# Por eso el orden de llamadas es el INVERSO del orden de ejecución.
app.add_middleware(TenantMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(cart.router, prefix="/cart", tags=["cart"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
app.include_router(payment_methods.router, prefix="/payment-methods", tags=["payment-methods"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(content.router, prefix="/content", tags=["content"])
app.include_router(integrations.router, prefix="/integrations", tags=["integrations"])

_uploads_dir = Path("./uploads")
_uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
