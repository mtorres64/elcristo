import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Layout } from "../components/layout/Layout";
import { Stepper } from "../components/checkout/Stepper";
import { AddressCard } from "../components/checkout/AddressCard";
import { AddressForm } from "../components/checkout/AddressForm";
import { PaymentMethodCard } from "../components/checkout/PaymentMethodCard";
import { PaymentMethodForm } from "../components/checkout/PaymentMethodForm";
import { GetnetPaymentForm } from "../components/checkout/GetnetPaymentForm";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { addressService } from "../services/address.service";
import { paymentService } from "../services/payment.service";
import { orderService } from "../services/order.service";
import { integrationsService } from "../services/integrations.service";
import type { Address, AddressInput } from "../types/address";
import type { PaymentCardInput, PaymentMethod } from "../types/payment";
import type { GetnetPublicConfig } from "../types/integration";
import { formatARS } from "../utils/currency";

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

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [pendingCard, setPendingCard] = useState<PaymentCardInput | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Si la tienda tiene Getnet activo, el checkout usa GetnetPaymentForm (pide
  // CVV, cobra de verdad) en vez del formulario mock / tarjetas guardadas
  // mock — coherente con el guardrail del backend, que rechaza
  // payment_method_id cuando el tenant cobra con Getnet. La tarjeta cargada
  // se guarda en el mismo `pendingCard` que ya usaba el flujo mock "no
  // guardada": misma forma de dato (PaymentCardInput), sólo que acá viene
  // con `security_code` seteado.
  const [getnetConfig, setGetnetConfig] = useState<GetnetPublicConfig | null>(null);

  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

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

  useEffect(() => {
    if (step !== "payment" || !isAuthenticated || getnetConfig?.enabled) return;
    setLoadingPayments(true);
    paymentService
      .list()
      .then((list) => {
        setPaymentMethods(list);
        const def = list.find((m) => m.is_default) ?? list[0];
        if (def) setSelectedPaymentId(def.payment_method_id);
        setShowPaymentForm(list.length === 0);
      })
      .catch(() => toast.error("No se pudieron cargar tus tarjetas"))
      .finally(() => setLoadingPayments(false));
  }, [step, isAuthenticated, getnetConfig?.enabled]);

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

  async function handleSavePaymentMethod(card: PaymentCardInput, save: boolean) {
    if (save) {
      const created = await paymentService.create(card);
      setPaymentMethods((prev) => [
        created,
        ...prev.map((m) => ({ ...m, is_default: created.is_default ? false : m.is_default })),
      ]);
      setSelectedPaymentId(created.payment_method_id);
      setPendingCard(null);
    } else {
      setPendingCard(card);
      setSelectedPaymentId(null);
    }
    setShowPaymentForm(false);
  }

  async function handleDeletePaymentMethod(paymentMethodId: string) {
    try {
      await paymentService.remove(paymentMethodId);
      setPaymentMethods((prev) => prev.filter((m) => m.payment_method_id !== paymentMethodId));
      if (selectedPaymentId === paymentMethodId) setSelectedPaymentId(null);
      toast.success("Tarjeta eliminada");
    } catch {
      toast.error("No se pudo eliminar la tarjeta");
    }
  }

  async function handleConfirmOrder() {
    if (!selectedAddressId) {
      toast.error("Elegí una dirección de envío");
      return;
    }
    if (!selectedPaymentId && !pendingCard) {
      toast.error("Elegí un método de pago");
      return;
    }

    setPlacingOrder(true);
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
        payment_method_id: selectedPaymentId ?? undefined,
        payment_card: pendingCard ?? undefined,
        save_card: false,
        notes: notes.trim() || null,
      });
      clearCart();
      toast.success("¡Pedido creado!");
      navigate(`/pedido/${result.order_id}`);
    } catch {
      toast.error("No se pudo crear el pedido. Intentá de nuevo.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (itemCount === 0) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-4">
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
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-6">Carrito de compras</h1>

        <div className="mb-8">
          <Stepper steps={STEPS} currentKey={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === "cart" && (
              <CartStep
                items={items}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            )}

            {step === "address" && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Elegí una dirección de envío</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
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

            {step === "payment" && (
              <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Elegí un método de pago</h2>
                  {!getnetConfig?.enabled && !showPaymentForm && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="text-xs font-semibold text-[#1A2B1C] hover:underline"
                    >
                      + Agregar tarjeta
                    </button>
                  )}
                </div>

                {getnetConfig?.enabled ? (
                  pendingCard ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#1A2B1C] bg-[#F4F8F4] p-4">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked readOnly className="w-4 h-4 accent-[#1A2B1C] shrink-0" />
                        <p className="text-sm text-[#1A1A1A]">
                          Tarjeta terminada en {pendingCard.card_number.slice(-4)}
                        </p>
                      </div>
                      <button
                        onClick={() => setPendingCard(null)}
                        className="text-xs font-semibold text-[#1A2B1C] hover:underline shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <GetnetPaymentForm
                      onCancel={() => {}}
                      onSave={async (card) => setPendingCard(card)}
                    />
                  )
                ) : loadingPayments ? (
                  <p className="text-sm text-[#8A8A8A] py-8 text-center">Cargando tarjetas...</p>
                ) : showPaymentForm ? (
                  <PaymentMethodForm
                    onCancel={() => setShowPaymentForm(false)}
                    onSave={handleSavePaymentMethod}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingCard && (
                      <div className="flex items-center gap-3 rounded-lg border border-[#1A2B1C] bg-[#F4F8F4] p-4">
                        <input type="radio" checked readOnly className="w-4 h-4 accent-[#1A2B1C] shrink-0" />
                        <p className="text-sm text-[#1A1A1A]">
                          Tarjeta terminada en {pendingCard.card_number.slice(-4)} (no guardada)
                        </p>
                      </div>
                    )}
                    {paymentMethods.map((m) => (
                      <PaymentMethodCard
                        key={m.payment_method_id}
                        method={m}
                        selected={selectedPaymentId === m.payment_method_id}
                        onSelect={() => { setSelectedPaymentId(m.payment_method_id); setPendingCard(null); }}
                        onDelete={() => handleDeletePaymentMethod(m.payment_method_id)}
                      />
                    ))}
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

                <ReviewBlock title="Método de pago" onEdit={() => setStep("payment")}>
                  {selectedPaymentId ? (
                    <p className="text-sm text-[#4A4A4A]">
                      {paymentMethods.find((m) => m.payment_method_id === selectedPaymentId)?.brand ?? "Tarjeta"}{" "}
                      terminada en {paymentMethods.find((m) => m.payment_method_id === selectedPaymentId)?.last4}
                    </p>
                  ) : pendingCard ? (
                    <p className="text-sm text-[#4A4A4A]">Tarjeta terminada en {pendingCard.card_number.slice(-4)}</p>
                  ) : (
                    <p className="text-sm text-[#DC2626]">No seleccionaste ningún método de pago</p>
                  )}
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
              shippingCost={0}
              discount={0}
              total={total}
            />

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
                  setStep("payment");
                } else if (step === "payment") {
                  if (!selectedPaymentId && !pendingCard) { toast.error("Elegí un método de pago"); return; }
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
        <div key={item.product_id} className="flex items-center gap-4 p-4">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
            {item.image_url && (
              <img
                src={item.image_url.startsWith("/uploads") ? `${API_BASE}${item.image_url}` : item.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.title}</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">{formatARS(item.price_snapshot)} c/u</p>
          </div>
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
          <p className="text-sm font-semibold text-[#1A1A1A] w-20 text-right shrink-0">
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
