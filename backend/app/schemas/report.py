from datetime import date

from pydantic import BaseModel


class DayPoint(BaseModel):
    date: date
    revenue: int = 0        # centavos
    cost: int = 0           # centavos
    orders: int = 0
    units: int = 0


class StatusCount(BaseModel):
    status: str
    count: int
    total: int              # centavos


class SalesReport(BaseModel):
    revenue: int            # centavos, sólo pedidos en estados de venta efectiva
    order_count: int
    units: int
    avg_ticket: int         # centavos
    by_day: list[DayPoint]
    by_status: list[StatusCount]


class PurchasesReport(BaseModel):
    total_cost: int         # centavos
    purchase_count: int
    units: int
    by_day: list[DayPoint]


class MarginProductRow(BaseModel):
    product_id: str
    title: str
    units: int
    revenue: int            # centavos
    cogs: int               # centavos
    profit: int             # centavos
    margin_pct: float | None


class MarginsReport(BaseModel):
    revenue: int            # centavos
    cogs: int               # centavos
    gross_profit: int       # centavos
    margin_pct: float | None
    items_without_cost: int
    by_product: list[MarginProductRow]


class ReportOverview(BaseModel):
    date_from: date
    date_to: date
    sales: SalesReport
    purchases: PurchasesReport
    margins: MarginsReport
