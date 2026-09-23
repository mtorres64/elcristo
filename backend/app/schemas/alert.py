from datetime import datetime

from pydantic import BaseModel


class LowStockAlertItem(BaseModel):
    product_id: str
    title: str
    image_url: str | None = None
    stock: int
    category_name: str | None = None


class NewOrderAlertItem(BaseModel):
    order_id: str
    order_number: str
    buyer_name: str
    total: int
    created_at: datetime


class AlertsResponse(BaseModel):
    low_stock: list[LowStockAlertItem]
    low_stock_count: int
    new_orders: list[NewOrderAlertItem]
    new_orders_count: int
