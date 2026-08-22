import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { integrationsService } from "../../services/integrations.service";
import type { GetnetEnvironment, GetnetIntegration } from "../../types/integration";

/* ─── Secciones de integración ──────────────────────────────────
 * Mismo patrón extensible que Settings.tsx: para sumar otro proveedor de
 * pago (o cualquier otra integración) alcanza con agregar una entrada acá
 * y su bloque correspondiente en el render de abajo. */
type SectionId = "getnet";

const SECTIONS: { id: SectionId; label: string }[] = [{ id: "getnet", label: "Getnet" }];

const ENV_TABS: { id: GetnetEnvironment; label: string }[] = [
  { id: "sandbox", label: "Sandbox (pruebas)" },
  { id: "production", label: "Producción" },
];

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors disabled:bg-[#F9F8F5] disabled:text-[#8A8A8A]";

const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

interface EnvForm {
  sellerId: string;
  clientId: string;
  editingSecret: boolean;
  clientSecret: string;
}

function emptyEnvForm(): EnvForm {
  return { sellerId: "", clientId: "", editingSecret: true, clientSecret: "" };
}

const EMPTY: GetnetIntegration = {
  enabled: false,
  active_environment: "sandbox",
  sandbox: {
    seller_id: null, client_id: null, client_secret_set: false,
    last_verified_at: null, last_verified_ok: null, last_verified_message: null,
  },
  production: {
    seller_id: null, client_id: null, client_secret_set: false,
    last_verified_at: null, last_verified_ok: null, last_verified_message: null,
  },
  updated_at: null,
};

export function Integrations() {
  const [section, setSection] = useState<SectionId>("getnet");

  const [data, setData] = useState<GetnetIntegration>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [activeEnvironment, setActiveEnvironment] = useState<GetnetEnvironment>("sandbox");
  const [tab, setTab] = useState<GetnetEnvironment>("sandbox");
  const [forms, setForms] = useState<Record<GetnetEnvironment, EnvForm>>({
    sandbox: emptyEnvForm(),
    production: emptyEnvForm(),
  });

  function applyData(d: GetnetIntegration) {
    setData(d);
    setEnabled(d.enabled);
    setActiveEnvironment(d.active_environment);
    setForms({
      sandbox: {
        sellerId: d.sandbox.seller_id ?? "", clientId: d.sandbox.client_id ?? "",
        editingSecret: !d.sandbox.client_secret_set, clientSecret: "",
      },
      production: {
        sellerId: d.production.seller_id ?? "", clientId: d.production.client_id ?? "",
        editingSecret: !d.production.client_secret_set, clientSecret: "",
      },
    });
  }

  useEffect(() => {
    integrationsService
      .getGetnet()
      .then(applyData)
      .catch(() => toast.error("No se pudo cargar la integración de Getnet"))
      .finally(() => setLoading(false));
  }, []);

  function patchForm(env: GetnetEnvironment, patch: Partial<EnvForm>) {
    setForms((prev) => ({ ...prev, [env]: { ...prev[env], ...patch } }));
  }

  async function handleSave() {
    for (const env of ["sandbox", "production"] as const) {
      const f = forms[env];
      const hasAnyField = f.sellerId.trim() || f.clientId.trim() || f.clientSecret.trim();
      const isActive = env === activeEnvironment;
      if (isActive && enabled && (!f.sellerId.trim() || !f.clientId.trim())) {
        toast.error(`Completá seller ID y client ID de ${env === "sandbox" ? "Sandbox" : "Producción"}`);
        return;
      }
      if (!isActive && hasAnyField && (!f.sellerId.trim() || !f.clientId.trim())) {
        toast.error(`Completá seller ID y client ID de ${env === "sandbox" ? "Sandbox" : "Producción"}`);
        return;
      }
    }
    const activeForm = forms[activeEnvironment];
    if (enabled && activeForm.editingSecret && !activeForm.clientSecret.trim() && !data[activeEnvironment].client_secret_set) {
      toast.error(
        `Completá el client secret de ${activeEnvironment === "sandbox" ? "Sandbox" : "Producción"} para activar la integración`
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await integrationsService.updateGetnet({
        enabled,
        active_environment: activeEnvironment,
        sandbox: {
          seller_id: forms.sandbox.sellerId.trim(),
          client_id: forms.sandbox.clientId.trim(),
          client_secret: forms.sandbox.editingSecret && forms.sandbox.clientSecret.trim()
            ? forms.sandbox.clientSecret.trim() : undefined,
        },
        production: {
          seller_id: forms.production.sellerId.trim(),
          client_id: forms.production.clientId.trim(),
          client_secret: forms.production.editingSecret && forms.production.clientSecret.trim()
            ? forms.production.clientSecret.trim() : undefined,
        },
      });
      applyData(updated);
      toast.success("Integración actualizada");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "No se pudieron guardar los cambios";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const result = await integrationsService.testGetnetConnection(tab);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      const refreshed = await integrationsService.getGetnet();
      applyData(refreshed);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "No se pudo probar la conexión";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  }

  const tabForm = forms[tab];
  const tabData = data[tab];
  const isActiveTab = tab === activeEnvironment;

  return (
    <AdminLayout>
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full max-w-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Integraciones
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              Conectá servicios externos a tu tienda, como pasarelas de pago
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="hidden sm:block bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                section === s.id
                  ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
                  : "bg-white text-[#4A4A4A] border-[#E8E2D8] hover:border-[#5A7A5C] hover:text-[#1A2B1C]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
            <p className="font-serif text-lg text-[#8A8A8A]">Cargando…</p>
          </div>
        ) : section === "getnet" ? (
          <div className="bg-white border border-[#E8E2D8] rounded-lg p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Getnet — Cobros con tarjeta
                </h2>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  Tokenización de tarjeta directo en el checkout, sin salir de tu tienda.
                </p>
              </div>
              <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                <span className="text-xs font-medium text-[#4A4A4A]">
                  {enabled ? "Activa" : "Inactiva"}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-9 h-5 rounded-full appearance-none bg-[#E8E2D8] checked:bg-[#1A2B1C] relative transition-colors cursor-pointer
                    before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-transform
                    checked:before:translate-x-4"
                />
              </label>
            </div>

            {enabled && (
              <p className="text-xs bg-[#F4F8F4] border border-[#CFE3CF] text-[#2E5A2E] rounded-lg px-3.5 py-2.5">
                El checkout está cobrando con el ambiente{" "}
                <strong>{activeEnvironment === "sandbox" ? "Sandbox (pruebas)" : "Producción"}</strong>.
                {activeEnvironment === "production" && " Los pedidos se cobran de verdad."}
              </p>
            )}

            {/* Tabs de ambiente — cada uno guarda credenciales independientes */}
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] -mb-1">
              {ENV_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px rounded-none transition-colors ${
                    tab === t.id
                      ? "border-[#1A2B1C] text-[#1A2B1C]"
                      : "border-transparent text-[#8A8A8A] hover:text-[#1A1A1A]"
                  }`}
                >
                  {t.label}
                  {t.id === activeEnvironment && (
                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide bg-[#EAF3EA] text-[#2E5A2E] px-1.5 py-0.5 rounded-full align-middle">
                      en uso
                    </span>
                  )}
                </button>
              ))}
            </div>

            {!isActiveTab && (
              <button
                type="button"
                onClick={() => setActiveEnvironment(tab)}
                className="self-start text-xs font-medium text-[#1A2B1C] hover:underline"
              >
                Usar {tab === "sandbox" ? "Sandbox" : "Producción"} para cobrar en el checkout
              </button>
            )}

            <div>
              <label className={LABEL}>Seller ID</label>
              <input
                value={tabForm.sellerId}
                onChange={(e) => patchForm(tab, { sellerId: e.target.value })}
                placeholder="uuid del comercio en Getnet"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Client ID</label>
              <input
                value={tabForm.clientId}
                onChange={(e) => patchForm(tab, { clientId: e.target.value })}
                placeholder="client_id"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Client secret</label>
              {tabForm.editingSecret ? (
                <input
                  type="password"
                  value={tabForm.clientSecret}
                  onChange={(e) => patchForm(tab, { clientSecret: e.target.value })}
                  placeholder="client_secret"
                  className={INPUT}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input value="•••••••• configurado" disabled className={INPUT} />
                  <button
                    type="button"
                    onClick={() => patchForm(tab, { editingSecret: true })}
                    className="text-xs font-medium text-[#1A2B1C] hover:underline shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F0EDE8]">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg disabled:opacity-50"
              >
                {testing ? "Probando…" : `Probar conexión (${tab === "sandbox" ? "Sandbox" : "Producción"})`}
              </button>

              {tabData.last_verified_ok !== null && (
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    tabData.last_verified_ok
                      ? "bg-[#EAF3EA] text-[#2E5A2E]"
                      : "bg-[#FEF2F2] text-[#B91C1C]"
                  }`}
                >
                  {tabData.last_verified_ok ? "✓ " : "✕ "}
                  {tabData.last_verified_message}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
