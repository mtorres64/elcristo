# Tienda — Marketplace Multitenant

Marketplace online similar a Mercado Libre. Multitenant, multirubro.

**Stack:** MongoDB · FastAPI (Python 3.12) · React 18 + Vite + TypeScript + Tailwind CSS

---

## Inicio rápido (desarrollo)

### Requisitos

- Docker + Docker Compose
- Python 3.12 (para desarrollo local sin Docker)
- Node.js 20+

### Con Docker (recomendado)

```bash
# 1. Copiar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env y setear SECRET_KEY

# 2. Levantar todos los servicios
docker compose -f docker-compose.dev.yml up

# 3. (Primera vez) Crear índices y cargar datos de prueba
docker compose -f docker-compose.dev.yml exec backend python scripts/create_indexes.py
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_db.py
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

### Sin Docker (desarrollo local)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env        # editar SECRET_KEY
python scripts/create_indexes.py
python scripts/seed_db.py
uvicorn app.main:app --reload

# Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Datos de prueba (seed)

| Rol | Email | Password |
|---|---|---|
| Seller | seller@tienda.com | seller123 |
| Buyer | buyer@tienda.com | buyer123 |

Tiendas: `tech-store`, `moda-ba`

---

## Estructura del proyecto

```
tienda/
├── backend/        Python + FastAPI
├── frontend/       React + Vite + TypeScript
├── docs/           Documentación del proyecto (fuente de verdad)
└── docker-compose.dev.yml
```

## Documentación

Toda la documentación técnica está en [docs/](docs/). Leer [docs/README.md](docs/README.md) primero.

---

## Tests (backend)

```bash
cd backend
pytest
```

---

## Fases de desarrollo

Ver [docs/roadmap.md](docs/roadmap.md) para el detalle completo.

- **Fase 1** (Semanas 1–4): Skeleton MVP — auth, tiendas, productos, UI básica
- **Fase 2** (Semanas 5–8): Comercio real — carrito, checkout, MercadoPago
- **Fase 3** (Semanas 9–12): Descubrimiento — búsqueda, reviews, variantes
- **Fase 4** (Semanas 13–16): Crecimiento del seller — analytics, planes, admin
- **Fase 5+**: Escala y pulido
