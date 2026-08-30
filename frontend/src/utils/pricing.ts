// Markup sobre costo: precio = costo * (1 + markup% / 100).

export function suggestedPrice(costCents: number, markupPct: number): number {
  return Math.round(costCents * (1 + markupPct / 100));
}

export function markupPct(priceCents: number | null, costCents: number | null): number | null {
  if (!costCents || priceCents == null) return null;
  return Math.round(((priceCents - costCents) / costCents) * 1000) / 10;
}

export function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}
