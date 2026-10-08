import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Layout } from "../components/layout/Layout";
import { Stepper } from "../components/checkout/Stepper";
import { AddressCard } from "../components/checkout/AddressCard";
import { AddressForm } from "../components/checkout/AddressForm";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { ShippingZoneSelector } from "../components/checkout/ShippingZoneSelector";
import type { ShippingChoice } from "../components/checkout/ShippingZoneSelector";
import { LowStockNotice } from "../components/shared/LowStockNotice";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { addressService } from "../services/address.service";
import { orderService } from "../services/order.service";
import { integrationsService } from "../services/integrations.service";
import { storeSettingsService } from "../services/storeSettings.service";
import type { Address, AddressInput } from "../types/address";
import type { GetnetPublicConfig } from "../types/integration";
import type { ShippingZone } from "../services/storeSettings.service";
import { formatARS } from "../utils/currency";
import { normalizeText } from "../utils/text";
import { useWhatsappBase, withWhatsappMessage } from "../hooks/useWhatsappBase";
import { SocialIcon } from "../components/social/socialPlatforms";

/** Sugiere la zona cuyo listado de localidades matchea la de la dirección
 * (ver el campo "Localidades/barrios que incluye" en Configuración >
 * Envíos) — sólo sugiere, nunca decide sola: el cliente siempre puede
 * elegir otra cosa en el selector. */
function matchZoneByLocality(zones: ShippingZone[], locality: string): ShippingZone | null {
  const n = normalizeText(locality);
  if (!n) return null;
  return (
    zones.find((z) =>
      z.localities.some((loc) => {
        const zn = normalizeText(loc);
        return !!zn && (zn === n || zn.includes(n) || n.includes(zn));
      })
    ) ?? null
  );
}

type Step = "cart" | "address" | "payment" | "review";

const STEPS = [
  { key: "cart", label: "Carrito" },
  { key: "address", label: "Dirección" },
  { key: "payment", label: "Pago" },
  { key: "review", label: "Confirmación" },
];

export function Cart() {
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("cart");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  // Localidad tipeada/autocompletada en el formulario todavía no guardado —
  // permite sugerir la zona de envío antes de apretar "Guardar dirección".
  const [draftLocality, setDraftLocality] = useState("");
  const [shippingChoice, setShippingChoice] = useState<ShippingChoice>(null);
  // Distingue una elección hecha a mano de una sugerida automáticamente por
  // la dirección (una zona real, o "other" si la localidad no matchea
  // ninguna), para no pisar la elección manual si el cliente después
  // cambia de dirección (ver el efecto de auto-match más abajo).
  const [autoSuggestedChoice, setAutoSuggestedChoice] = useState<ShippingChoice>(null);

  // Sin una integración de pago activa (hoy, Getnet), el backend rechaza
  // cualquier pedido — ya no existe un flujo "mock" que lo deje pasar sin
  // cobrar de verdad. `getnetConfig` null = todavía cargando; `enabled:
  // false` = la tienda no puede cobrar, así que el paso de pago bloquea el
  // checkout en vez de dejar avanzar hacia un pago que igual no va a andar.
  const [getnetConfig, setGetnetConfig] = useState<GetnetPublicConfig | null>(null);

  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  // La pasarela no pudo iniciar el pago (502): se ofrece pagar por
  // transferencia coordinando por WhatsApp en vez de dejar al cliente trabado.
  const [cardPaymentUnavailable, setCardPaymentUnavailable] = useState(false);

  const { data: shipping } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: () => storeSettingsService.getShipping(),
    staleTime: 5 * 60 * 1000,
  });

  // Si el vendedor todavía no configuró ninguna zona, el checkout se
  // comporta como antes (envío "a calcular", sin exigir que se elija nada acá).
  const hasShippingOptions = !!shipping?.zones.length;
  const whatsappBase = useWhatsappBase(shipping?.whatsapp_number);
  const transferWaHref = whatsappBase
    ? withWhatsappMessage(whatsappBase, "Hola! No pude pagar con tarjeta en la tienda y quiero pagar mi pedido por transferencia.")
    : null;
  // Mismo número, mensaje distinto: acá el cliente ni llegó a intentar pagar
  // con tarjeta porque la tienda no tiene ninguna pasarela habilitada.
  const noPaymentWaHref = whatsappBase
    ? withWhatsappMessage(whatsappBase, "Hola! Quiero comprar en la tienda, pero no hay ningún método de pago disponible. ¿Cómo hago mi pedido?")
    : null;

  // Costo/descuento mostrados acá son sólo para el resumen — el server
  // recalcula lo mismo a partir de shippingChoice antes de cobrar (ver
  // create_order/_resolve_shipping), nunca confía en este número.
  const selectedZone = shipping?.zones.find((z) => z.id === shippingChoice) ?? null;
  const shippingCost = selectedZone
    ? selectedZone.free_from != null && total >= selectedZone.free_from
      ? 0
      : selectedZone.cost
    : 0;
  const discount =
    shippingChoice === "pickup" && shipping ? Math.round((total * shipping.pickup_discount_pct) / 100) : 0;
  const orderTotal = total + shippingCost - discount;

  // Preselecciona (o corrige) la zona según la localidad de la dirección.
  // Una zona con costo fijo representa una promesa geográfica concreta, así
  // que a diferencia de "pickup" u "other" NUNCA queda pegada si deja de
  // corresponder — ni siquiera si se había elegido a mano: si el cliente
  // cambia la localidad a algo fuera de esa zona, se corrige sola (a la
  // zona correcta, o a "other" si ninguna aplica) en vez de dejar
  // seleccionado un costo que ya no es el real.
  useEffect(() => {
    if (!hasShippingOptions || !shipping) return;

    const locality = showAddressForm
      ? draftLocality
      : addresses.find((a) => a.address_id === selectedAddressId)?.locality ?? "";
    const match = locality ? matchZoneByLocality(shipping.zones, locality) : null;
    const currentIsZone = shipping.zones.some((z) => z.id === shippingChoice);

    if (currentIsZone) {
      if (match?.id !== shippingChoice) {
        const next: ShippingChoice = match ? match.id : locality ? "other" : null;
        setShippingChoice(next);
        setAutoSuggestedChoice(next);
      }
      return;
    }

    // "pickup" no depende de la dirección — nunca se toca.
    if (shippingChoice === "pickup") return;

    // shippingChoice es null u "other": sólo autosugerimos si la elección
    // actual ya era una sugerencia previa (no pisamos un "other" que el
    // cliente haya marcado él mismo a propósito).
    if (shippingChoice && shippingChoice !== autoSuggestedChoice) return;
    if (!locality) return;
    const suggestion: ShippingChoice = match ? match.id : "other";
    if (suggestion !== shippingChoice) {
      setShippingChoice(suggestion);
      setAutoSuggestedChoice(suggestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, addresses, showAddressForm, draftLocality, shipping, hasShippingOptions, shippingChoice]);

  function handleShippingChoiceChange(choice: ShippingChoice) {
    setAutoSuggestedChoice(null);
    setShippingChoice(choice);
  }

  useEffect(() => {
    if (step !== "address" || !isAuthenticated) return;
    setLoadingAddresses(true);
    addressService
      .list()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) setSelectedAddressId(def.address_id);
        setShowAddressForm(list.length === 0);
      })
      .catch(() => toast.error("No se pudieron cargar tus direcciones"))
      .finally(() => setLoadingAddresses(false));
  }, [step, isAuthenticated]);

  useEffect(() => {
    if (step !== "payment" || !isAuthenticated) return;
    integrationsService
      .getGetnetPublicConfig()
      .then(setGetnetConfig)
      .catch(() => setGetnetConfig({ enabled: false, environment: "sandbox", seller_id: null }));
  }, [step, isAuthenticated]);

  function goToAddress() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setStep("address");
  }

  async function handleSaveAddress(data: AddressInput) {
    const created = await addressService.create(data);
    setAddresses((prev) => [created, ...prev.map((a) => ({ ...a, is_default: created.is_default ? false : a.is_default }))]);
    setSelectedAddressId(created.address_id);
    setShowAddressForm(false);
    toast.success("Dirección guardada");
  }

  async function handleDeleteAddress(addressId: string) {
    try {
      await addressService.remove(addressId);
      setAddresses((prev) => prev.filter((a) => a.address_id !== addressId));
      if (selectedAddressId === addressId) setSelectedAddressId(null);
      toast.success("Dirección eliminada");
    } catch {
      toast.error("No se pudo eliminar la dirección");
    }
  }

  async function handleConfirmOrder() {
    if (!selectedAddressId) {
      toast.error("Elegí una dirección de envío");
      return;
    }
    if (addresses.find((a) => a.address_id === selectedAddressId)?.lat == null) {
      toast.error("La dirección necesita ubicación en el mapa");
      setStep("address");
      return;
    }
    if (hasShippingOptions && (!shippingChoice || shippingChoice === "other")) {
      toast.error("Elegí una opción de envío válida");
      setStep("address");
      return;
    }
    if (!getnetConfig?.enabled) {
      toast.error("Esta tienda no tiene un método de pago habilitado por el momento");
      return;
    }

    setPlacingOrder(true);
    setCardPaymentUnavailable(false);
    try {
      const result = await orderService.create({
        items: items.map((i) => ({
          product_id: i.product_id,
          title: i.title,
          price: i.price_snapshot,
          quantity: i.quantity,
          image_url: i.image_url,
        })),
        address_id: selectedAddressId,
        shipping_zone_id: shippingChoice && shippingChoice !== "pickup" ? shippingChoice : undefined,
        pickup: shippingChoice === "pickup",
        notes: notes.trim() || null,
      });
      // El pedido ya quedó creado (pending_payment) — el pago en sí pasa en
      // una página alojada por Getnet, no acá. Se sale de la SPA a propósito
      // (navegación completa, no `navigate` de react-router).
      clearCart();
      window.location.href = result.checkout_url;
    } catch (err: unknown) {
      // 502 = la pasarela no pudo iniciar el pago (no es un rechazo de la
      // tarjeta — eso ni siquiera se sabe todavía en este punto del flujo).
      if ((err as { response?: { status?: number } })?.response?.status === 502) {
        setCardPaymentUnavailable(true);
      } else {
        toast.error("No se pudo crear el pedido. Intentá de nuevo.");
      }
    } finally {
      setPlacingOrder(false);
    }
  }

  if (itemCount === 0) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-24 flex flex-col items-center text-center gap-4">
          <CartEmptyIcon />
          <h1 className="font-serif text-2xl text-[#1A1A1A]">Tu carrito está vacío</h1>
          <p className="text-sm text-[#6B6B6B] max-w-sm">
            Todavía no agregaste ninguna planta. Explorá el catálogo y encontrá tu próxima favorita.
          </p>
          <button onClick={() => navigate("/products")} className="btn-primary mt-2">
            Ver plantas
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-10">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-6">Carrito de compras</h1>

        <div className="mb-8">
          <Stepper steps={STEPS} currentKey={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === "cart" && (
              <>
                {shipping?.low_stock_note && (
                  <LowStockNotice
                    note={shipping.low_stock_note}
                    whatsappNumber={shipping.whatsapp_number}
                    className="mb-4"
                  />
                )}
                <CartStep
                  items={items}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              </>
            )}

            {step === "address" && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Elegí una dirección de envío</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        setDraftLocality("");
                        setShowAddressForm(true);
                      }}
                      className="text-xs font-semibold text-[#1A2B1C] hover:underline"
                    >
                      + Agregar nueva dirección
                    </button>
                  )}
                </div>

                {loadingAddresses ? (
                  <p className="text-sm text-[#8A8A8A] py-8 text-center">Cargando direcciones...</p>
                ) : showAddressForm ? (
                  <AddressForm
                    hasExistingAddresses={addresses.length > 0}
                    onCancel={() => setShowAddressForm(false)}
                    onSave={handleSaveAddress}
                    onLocalityChange={setDraftLocality}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {addresses.map((a) => (
                      <AddressCard
                        key={a.address_id}
                        address={a}
                        selected={selectedAddressId === a.address_id}
                        onSelect={() => setSelectedAddressId(a.address_id)}
                        onDelete={() => handleDeleteAddress(a.address_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "address" && hasShippingOptions && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5 mt-4">
                <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">¿Cómo recibís tu pedido?</h2>
                <ShippingZoneSelector
                  zones={shipping.zones}
                  pickupDiscountPct={shipping.pickup_discount_pct}
                  otherNote={shipping.other_zones_note}
                  whatsappNumber={shipping.whatsapp_number}
                  subtotal={total}
                  value={shippingChoice}
                  onChange={handleShippingChoiceChange}
                  suggestedZoneId={autoSuggestedChoice}
                />
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
                <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Método de pago</h2>

                {getnetConfig === null ? (
                  <p className="text-sm text-[#8A8A8A] py-8 text-center">Cargando…</p>
                ) : getnetConfig.enabled ? (
                  // Con Web Checkout la tarjeta se carga en una página de
                  // Getnet, no acá — no hay formulario propio que mostrar.
                  <div className="flex items-start gap-3 rounded-lg border border-[#CFE3CF] bg-[#F4F8F4] p-4">
                    <svg
                      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A2E"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0 mt-0.5" aria-hidden="true"
                    >
                      <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">
                      Al confirmar el pedido te vamos a redirigir a una página segura de{" "}
                      <strong>Getnet</strong> para cargar la tarjeta y elegir las cuotas. Volvés a
                      Vivero El Cristo apenas termine el pago.
                    </p>
                  </div>
                ) : (
                  // Sin una pasarela de pago activa, el backend rechaza cualquier
                  // pedido — no tiene sentido dejar avanzar el checkout, así que
                  // se bloquea acá directamente.
                  <div role="alert" className="rounded-lg border border-[#EAD9B4] bg-[#FBF3E5] p-4 text-sm text-[#8A6D3B] leading-relaxed">
                    <p className="font-semibold mb-1">Esta tienda no tiene un método de pago habilitado</p>
                    <p>Todavía no podés completar la compra por acá. Escribinos por WhatsApp y coordinamos tu pedido.</p>
                    {noPaymentWaHref && (
                      <a
                        href={noPaymentWaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#253824] transition-colors"
                      >
                        <SocialIcon platform="whatsapp" size={14} />
                        Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === "review" && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5 flex flex-col gap-5">
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Revisá tu pedido</h2>

                {addresses.find((a) => a.address_id === selectedAddressId) && (
                  <ReviewBlock title="Dirección de envío" onEdit={() => setStep("address")}>
                    {(() => {
                      const a = addresses.find((x) => x.address_id === selectedAddressId)!;
                      return (
                        <p className="text-sm text-[#4A4A4A]">
                          {a.street} {a.no_number ? "(sin número)" : ""}, {a.locality}, {a.province}
                          <br />
                          {a.full_name} · {a.phone_country_code} {a.phone}
                        </p>
                      );
                    })()}
                  </ReviewBlock>
                )}

                {hasShippingOptions && (
                  <ReviewBlock title="Envío" onEdit={() => setStep("address")}>
                    <p className="text-sm text-[#4A4A4A]">
                      {shippingChoice === "pickup"
                        ? `Retiro por el local (${shipping?.pickup_discount_pct}% de descuento)`
                        : selectedZone
                          ? `${selectedZone.name} · ${shippingCost > 0 ? formatARS(shippingCost) : "Gratis"}`
                          : "Sin elegir"}
                    </p>
                  </ReviewBlock>
                )}

                <ReviewBlock title="Método de pago" onEdit={() => setStep("payment")}>
                  <p className="text-sm text-[#4A4A4A]">
                    Tarjeta — se carga en el siguiente paso, en una página segura de Getnet.
                  </p>
                </ReviewBlock>

                <div>
                  <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                    Notas para el pedido <span className="text-[#ABABAB] font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ej: dejar en portería, horario de entrega preferido..."
                    className="w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <OrderSummary
              items={items.map((i) => ({
                title: i.title,
                price: i.price_snapshot,
                quantity: i.quantity,
                image_url: i.image_url,
              }))}
              subtotal={total}
              shippingCost={shippingCost}
              shippingChosen={!!shippingChoice && shippingChoice !== "other"}
              discount={discount}
              total={orderTotal}
            />

            {step === "review" && cardPaymentUnavailable && (
              <div
                role="alert"
                className="rounded-lg border border-[#EAD9B4] bg-[#FBF3E5] p-4 text-sm text-[#8A6D3B] leading-relaxed"
              >
                <p className="font-semibold mb-1">El pago con tarjeta no está disponible por el momento</p>
                <p>
                  No pudimos procesar tu pago. Podés escribirnos por WhatsApp y coordinar el pago de tu pedido
                  por transferencia.
                </p>
                {transferWaHref && (
                  <a
                    href={transferWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#253824] transition-colors"
                  >
                    <SocialIcon platform="whatsapp" size={14} />
                    Pagar por transferencia
                  </a>
                )}
              </div>
            )}

            <StepActions
              step={step}
              onBack={() => {
                if (step === "address") setStep("cart");
                else if (step === "payment") setStep("address");
                else if (step === "review") setStep("payment");
              }}
              onNext={() => {
                if (step === "cart") goToAddress();
                else if (step === "address") {
                  if (!selectedAddressId) { toast.error("Elegí una dirección"); return; }
                  if (addresses.find((a) => a.address_id === selectedAddressId)?.lat == null) {
                    toast.error("Esa dirección no tiene ubicación en el mapa. Agregá una nueva marcándola.");
                    return;
                  }
                  if (hasShippingOptions && !shippingChoice) { toast.error("Elegí una opción de envío"); return; }
                  if (shippingChoice === "other") { toast.error("Coordiná el envío por WhatsApp antes de continuar"); return; }
                  setStep("payment");
                } else if (step === "payment") {
                  if (!getnetConfig?.enabled) { toast.error("Esta tienda no tiene un método de pago habilitado"); return; }
                  setStep("review");
                }
              }}
              onConfirm={handleConfirmOrder}
              placingOrder={placingOrder}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CartStep({
  items,
  onUpdateQuantity,
  onRemove,
}: {
  items: { product_id: string; title: string; price_snapshot: number; quantity: number; image_url: string | null }[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  return (
    <div className="rounded-lg border border-[#E8E2D8] bg-white divide-y divide-[#F0EDE8]">
      {items.map((item) => (
        <div key={item.product_id} className="flex items-start sm:items-center gap-4 p-4">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
            {item.image_url && (
              <img
                src={item.image_url.startsWith("/uploads") ? `${API_BASE}${item.image_url}` : item.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.title}</p>
              <p className="text-xs text-[#8A8A8A] mt-0.5">{formatARS(item.price_snapshot)} c/u</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
              <div className="flex items-center border border-[#E8E2D8] rounded-lg shrink-0">
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F4EE] transition-colors"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="w-8 h-8 flex items-center justify-center text-sm font-medium text-[#1A1A1A]">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F4EE] transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-semibold text-[#1A1A1A] sm:w-20 text-right shrink-0">
                {formatARS(item.price_snapshot * item.quantity)}
              </p>
              <button
                onClick={() => onRemove(item.product_id)}
                className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
                aria-label="Quitar del carrito"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8A8A]">{title}</p>
        <button onClick={onEdit} className="text-xs text-[#1A2B1C] hover:underline">
          Cambiar
        </button>
      </div>
      {children}
    </div>
  );
}

function StepActions({
  step,
  onBack,
  onNext,
  onConfirm,
  placingOrder,
}: {
  step: Step;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
  placingOrder: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E8E2D8] bg-white p-4 flex flex-col gap-2">
      {step === "review" ? (
        <button onClick={onConfirm} disabled={placingOrder} className="btn-primary w-full py-3.5 disabled:opacity-50">
          {placingOrder ? "Confirmando..." : "Confirmar pedido"}
        </button>
      ) : (
        <button onClick={onNext} className="btn-primary w-full py-3.5">
          Continuar
        </button>
      )}
      {step !== "cart" && (
        <button onClick={onBack} className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] py-2 transition-colors">
          Volver al paso anterior
        </button>
      )}
    </div>
  );
}

function CartEmptyIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C8C0B4" strokeWidth="1.3">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
