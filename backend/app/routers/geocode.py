"""Proxy de reverse geocoding para el botón "Usar mi ubicación" del checkout.

Nominatim (OpenStreetMap) exige un User-Agent identificando la aplicación y
limita a 1 request/seg por IP de origen — un `fetch` hecho directo desde el
navegador siempre manda el User-Agent real del navegador (no se puede
pisar esa cabecera desde JS), así que pegarle a Nominatim desde el cliente
incumple su política de uso y explica los fallos intermitentes que veía el
vendedor ("No pudimos completar la dirección automáticamente"). Acá lo
llamamos desde el server con un User-Agent propio y un throttle simple para
no pasarnos del límite y terminar bloqueados.
"""

import asyncio
import time

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
_USER_AGENT = "ViveroElCristoTienda/1.0 (+https://viveroelcristo.com)"
_TIMEOUT = httpx.Timeout(8.0, connect=4.0)

# Throttle en proceso: Nominatim pide como máximo 1 req/seg por IP.
_lock = asyncio.Lock()
_last_call = 0.0


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    global _last_call
    async with _lock:
        wait = 1.0 - (time.monotonic() - _last_call)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                res = await client.get(
                    _NOMINATIM_URL,
                    params={
                        "format": "jsonv2",
                        "lat": lat,
                        "lon": lng,
                        "addressdetails": 1,
                        "accept-language": "es",
                    },
                    headers={"User-Agent": _USER_AGENT},
                )
        except httpx.HTTPError:
            raise HTTPException(502, "No se pudo contactar el servicio de geocodificación") from None
        finally:
            _last_call = time.monotonic()

    if res.status_code != 200:
        raise HTTPException(502, "No se pudo obtener la dirección")

    return res.json().get("address", {})
