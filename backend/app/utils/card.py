"""Utilidades para el mock de tarjeta guardada.

No hay pasarela de pago real conectada todavía (ver docs/roadmap.md, Fase 2).
Estas funciones sólo derivan datos no sensibles (marca, últimos 4 dígitos) a
partir de un número de tarjeta que llega en la request y nunca se persiste.
"""

import re


def luhn_is_valid(card_number: str) -> bool:
    digits = [int(d) for d in card_number if d.isdigit()]
    if len(digits) < 12 or len(digits) != len(card_number):
        return False
    checksum = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


def detect_brand(card_number: str) -> str:
    if re.match(r"^4\d{6,}$", card_number):
        return "visa"
    if re.match(r"^(5[1-5]\d{5,}|2(2[2-9]\d{3,}|[3-6]\d{4,}|7[01]\d{3,}|720\d{2,}))$", card_number):
        return "mastercard"
    if re.match(r"^3[47]\d{5,}$", card_number):
        return "amex"
    return "other"
