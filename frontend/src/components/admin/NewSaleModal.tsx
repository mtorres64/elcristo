import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { orderService } from "../../services/order.service";
import { userService } from "../../services/user.service";
import { storeSettingsService } from "../../services/storeSettings.service";
import type { ShippingSettings } from "../../services/storeSettings.service";
import type { ProductSummary } from "../../types/product";
import type { User } from "../../types/user";
import type { AddressInput } from "../../types/address";
import { ShippingZoneSelector } from "../checkout/ShippingZoneSelector";
import type { ShippingChoice } from "../checkout/ShippingZoneSelector";
import { AddressForm } from "../checkout/AddressForm";
import { ProductAutocomplete } from "./pos/ProductAutocomplete";
import { PaymentSplitRows, emptyPaymentRow } from "./pos/PaymentSplitRows";
import type { PosPaymentRow } from "./pos/PaymentSplitRows";
import { formatARS } from "../../utils/currency";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

interface PosCartLine {
  key: string;
  product_id: string;
  title: string;
  price: number;     // centavos, editable
  quantity: number;
  image_url: string | null;
  stock: number;      // snapshot al agregarlo — sólo para la UX, el server revalida
}

type CustomerMode = "account" | "guest";
type DiscountType = "none" | "flat" | "percent";

interface Props {
  onClose: () => void;
  onCreated: (result: { order_id: string; order_number: string; total: number }) => void;
}

export function NewSaleModal({ onClose, onCreated }: Props) {
  const [lines, setLines] = useState<PosCartLine[]>([]);

  const [customerMode, setCustomerMode] = useState<CustomerMode>("account");
  const [buyer, setBuyer] = useState<{ user_id: string; name: string; email: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [shippingCfg, setShippingCfg] = useState<ShippingSettings | null>(null);
  // Separado de la zona de envío: el retiro en el local tiene que poder
  // elegirse siempre en una venta POS (el cliente está físicamente en el
  // local), sin depender de si la tienda configuró un % de descuento por
  // retiro — a diferencia del checkout online, donde ShippingZoneSelector
  // sólo muestra esa opción cuando pickupDiscountPct > 0.
  const [pickup, setPickup] = useState(true);
  const [zoneChoice, setZoneChoice] = useState<ShippingChoice>(null);
  const [address, setAddress] = useState<AddressInput | null>(null);
  const [editingAddress, setEditingAddress] = useState(true);

  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");

  const [payments, setPayments] = useState<PosPaymentRow[]>([emptyPaymentRow()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeSettingsService.getShipping().then(setShippingCfg).catch(() => {});
  }, []);

  function addProduct(p: ProductSummary) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === p.product_id);
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, {
        key: Math.random().toString(36).slice(2),
        product_id: p.product_id,
        title: p.title,
        price: p.price,
        quantity: 1,
        image_url: p.image_url,
        stock: p.stock,
      }];
    });
  }

  function patchLine(key: string, patch: Partial<PosCartLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const zone = shippingCfg?.zones.find((z) => z.id === zoneChoice) ?? null;

  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + l.price * l.quantity, 0), [lines]);

  const shippingCost = pickup
    ? 0
    : zone
      ? (zone.free_from != null && subtotal >= zone.free_from ? 0 : zone.cost)
      : 0;

  const pickupDiscount = pickup && shippingCfg ? Math.round((subtotal * shippingCfg.pickup_discount_pct) / 100) : 0;
  const manualDiscount =
    discountType === "flat"
      ? Math.max(0, Math.round(Number(discountValue) * 100) || 0)
      : discountType === "percent"
        ? Math.round((subtotal * (Math.min(100, Math.max(0, Number(discountValue) || 0)))) / 100)
        : 0;
  const discount = pickupDiscount + manualDiscount;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const paidCents = payments.reduce((acc, r) => acc + (Math.round(Number(r.amount) * 100) || 0), 0);

  const customerReady = customerMode === "account" ? !!buyer : guestName.trim() !== "" && guestPhone.trim() !== "";
  const addressReady = pickup || (!!address && !editingAddress);
  const canSubmit = lines.length > 0 && customerReady && addressReady && paidCents === total && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const result = await orderService.createPosSale({
        items: lines.map((l) => ({
          product_id: l.product_id,
          title: l.title,
          price: l.price,
          quantity: l.quantity,
          image_url: l.image_url,
        })),
        buyer_id: customerMode === "account" ? buyer!.user_id : undefined,
        guest_name: customerMode === "guest" ? guestName.trim() : undefined,
        guest_phone: customerMode === "guest" ? guestPhone.trim() : undefined,
        pickup,
        shipping_zone_id: zone?.id,
        shipping_address: pickup ? undefined : address ?? undefined,
        discount_type: discountType,
        discount_value:
          discountType === "percent" ? Math.min(100, Math.max(0, Number(discountValue) || 0)) : manualDiscount,
        payments: payments.map((r) => ({
          method: r.method,
          amount: Math.round(Number(r.amount) * 100) || 0,
          installments: r.installments ? Number(r.installments) : null,
        })),
        notes: notes.trim() || undefined,
      });
      toast.success(`Venta ${result.order_number} registrada`);
      onCreated(result);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "No se pudo registrar la venta";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-[#E8E2D8] flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Nueva venta</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">Punto de venta — el cobro se hace in situ, no por la app</p>
          </div>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#1A1A1A] transition-colors text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Columna izquierda: productos / carrito */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Productos</p>
              <ProductAutocomplete onSelect={addProduct} />
            </div>

            <div className="border border-[#E8E2D8] rounded-lg divide-y divide-[#F0EDE8]">
              {lines.length === 0 ? (
                <p className="text-xs text-[#8A8A8A] px-3 py-6 text-center">Buscá productos para agregarlos a la venta.</p>
              ) : (
                lines.map((l) => (
                  <div key={l.key} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
                      {l.image_url && <img src={l.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{l.title}</p>
                      <p className="text-[11px] text-[#8A8A8A]">Stock disponible: {l.stock}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => patchLine(l.key, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-14 rounded-lg border border-[#E8E2D8] px-2 py-1.5 text-sm text-center"
                    />
                    <input
                      inputMode="decimal"
                      value={l.price / 100}
                      onChange={(e) => patchLine(l.key, { price: Math.round(Number(e.target.value) * 100) || 0 })}
                      className="w-24 rounded-lg border border-[#E8E2D8] px-2 py-1.5 text-sm text-right"
                    />
                    <span className="text-sm font-semibold text-[#1A1A1A] w-20 text-right shrink-0">
                      {formatARS(l.price * l.quantity)}
                    </span>
                    <button
                      onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                      className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
                      aria-label="Quitar producto"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Descuento</p>
              <div className="flex items-center gap-2">
                <select
                  value={discountType}
                  onChange={(e) => { setDiscountType(e.target.value as DiscountType); setDiscountValue(""); }}
                  className={`${INPUT} appearance-none cursor-pointer w-40`}
                >
                  <option value="none">Sin descuento</option>
                  <option value="flat">Monto fijo</option>
                  <option value="percent">Porcentaje</option>
                </select>
                {discountType !== "none" && (
                  <input
                    inputMode="decimal"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "%" : "$"}
                    className={`${INPUT} w-28`}
                  />
                )}
                {manualDiscount > 0 && (
                  <span className="text-xs text-[#3D6040]">-{formatARS(manualDiscount)}</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Notas (opcional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={INPUT}
              />
            </div>
          </div>

          {/* Columna derecha: cliente, entrega, pago */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Cliente</p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setCustomerMode("account")}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${customerMode === "account" ? "border-[#1A2B1C] bg-[#F4F8F4] text-[#1A2B1C]" : "border-[#E8E2D8] text-[#6B6B6B]"}`}
                >
                  Cliente registrado
                </button>
                <button
                  onClick={() => setCustomerMode("guest")}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${customerMode === "guest" ? "border-[#1A2B1C] bg-[#F4F8F4] text-[#1A2B1C]" : "border-[#E8E2D8] text-[#6B6B6B]"}`}
                >
                  Cliente ocasional
                </button>
              </div>
              {customerMode === "account" ? (
                <BuyerPicker selected={buyer} onSelect={setBuyer} />
              ) : (
                <div className="flex flex-col gap-2">
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nombre y apellido" className={INPUT} />
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Teléfono" className={INPUT} />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Entrega</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPickup(true)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${pickup ? "border-[#1A2B1C] bg-[#F4F8F4] text-[#1A2B1C]" : "border-[#E8E2D8] text-[#6B6B6B]"}`}
                >
                  Retiro en el local
                </button>
                <button
                  onClick={() => setPickup(false)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${!pickup ? "border-[#1A2B1C] bg-[#F4F8F4] text-[#1A2B1C]" : "border-[#E8E2D8] text-[#6B6B6B]"}`}
                >
                  Envío
                </button>
              </div>

              {!pickup && shippingCfg && (
                <ShippingZoneSelector
                  zones={shippingCfg.zones}
                  pickupDiscountPct={0}
                  otherNote={shippingCfg.other_zones_note}
                  whatsappNumber={shippingCfg.whatsapp_number}
                  subtotal={subtotal}
                  value={zoneChoice}
                  onChange={(v) => { setZoneChoice(v); setEditingAddress(true); }}
                />
              )}

              {!pickup && (
                <div className="mt-3">
                  {address && !editingAddress ? (
                    <div className="rounded-lg border border-[#E8E2D8] p-3 flex items-start justify-between gap-2">
                      <div className="text-xs text-[#4A4A4A]">
                        <p className="text-sm text-[#1A1A1A]">{address.street}</p>
                        <p>{address.locality}, {address.province}</p>
                        <p className="text-[#8A8A8A] mt-0.5">{address.full_name} · {address.phone}</p>
                      </div>
                      <button onClick={() => setEditingAddress(true)} className="text-xs text-[#1A2B1C] hover:underline shrink-0">Editar</button>
                    </div>
                  ) : (
                    <AddressForm
                      hasExistingAddresses
                      onCancel={() => setEditingAddress(false)}
                      onSave={async (data) => { setAddress(data); setEditingAddress(false); }}
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Pago</p>
              <PaymentSplitRows rows={payments} total={total} onChange={setPayments} />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#E8E2D8] shrink-0 flex items-center justify-between gap-4">
          <div className="flex flex-col text-xs text-[#6B6B6B]">
            <span>Subtotal: {formatARS(subtotal)}{shippingCost > 0 ? ` · Envío: ${formatARS(shippingCost)}` : ""}{discount > 0 ? ` · Descuento: -${formatARS(discount)}` : ""}</span>
            <span className="text-sm font-bold text-[#1A1A1A] mt-0.5">Total: {formatARS(total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-[#E8E2D8] text-sm font-medium text-[#4A4A4A] px-4 py-2.5 hover:bg-[#F9F8F5]">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Registrando…" : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerPicker({
  selected,
  onSelect,
}: {
  selected: { user_id: string; name: string; email: string } | null;
  onSelect: (u: { user_id: string; name: string; email: string } | null) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      userService
        .list({ role: "buyer", q: q.trim(), page_size: 8 })
        .then((r) => setResults(r.items))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, selected]);

  if (selected) {
    return (
      <div className="rounded-lg border border-[#E8E2D8] p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-[#1A1A1A] truncate">{selected.name}</p>
          <p className="text-xs text-[#8A8A8A] truncate">{selected.email}</p>
        </div>
        <button onClick={() => onSelect(null)} className="text-xs text-[#1A2B1C] hover:underline shrink-0">Cambiar</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar cliente por nombre o email…"
        className={INPUT}
      />
      {q.trim() && (
        <div className="border border-[#E8E2D8] rounded-lg divide-y divide-[#F0EDE8] mt-1.5 max-h-48 overflow-y-auto">
          {searching && <p className="text-xs text-[#8A8A8A] px-3 py-2">Buscando…</p>}
          {!searching && results.length === 0 && <p className="text-xs text-[#8A8A8A] px-3 py-2">Sin resultados.</p>}
          {!searching && results.map((u) => (
            <button
              key={u.user_id}
              type="button"
              onClick={() => { onSelect({ user_id: u.user_id, name: u.name, email: u.email }); setQ(""); setResults([]); }}
              className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-[#F9F8F5] transition-colors"
            >
              <span className="text-sm text-[#1A1A1A]">{u.name}</span>
              <span className="text-[11px] text-[#8A8A8A]">{u.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
