import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { integrationsService } from "../../../services/integrations.service";
import type { EmailIntegration } from "../../../types/integration";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors disabled:bg-[#F9F8F5] disabled:text-[#8A8A8A]";
const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

const EMPTY: EmailIntegration = {
  enabled: false,
  host: null,
  port: 587,
  username: null,
  from_email: null,
  use_tls: true,
  password_set: false,
  last_verified_at: null,
  last_verified_ok: null,
  last_verified_message: null,
  updated_at: null,
};

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
  );
}

export function EmailIntegrationCard() {
  const [data, setData] = useState<EmailIntegration>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [useTls, setUseTls] = useState(true);
  const [editingPassword, setEditingPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [testTo, setTestTo] = useState("");

  function applyData(d: EmailIntegration) {
    setData(d);
    setEnabled(d.enabled);
    setHost(d.host ?? "");
    setPort(String(d.port ?? 587));
    setUsername(d.username ?? "");
    setFromEmail(d.from_email ?? "");
    setUseTls(d.use_tls);
    setEditingPassword(!d.password_set);
    setPassword("");
  }

  useEffect(() => {
    integrationsService
      .getEmail()
      .then(applyData)
      .catch(() => toast.error("No se pudo cargar la integración de correo"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (enabled && (!host.trim() || !fromEmail.trim())) {
      toast.error("Completá host y remitente para activar el correo");
      return;
    }
    if (enabled && editingPassword && !password.trim() && !data.password_set) {
      toast.error("Completá la contraseña SMTP para activar el correo");
      return;
    }
    setSaving(true);
    try {
      const updated = await integrationsService.updateEmail({
        enabled,
        host: host.trim(),
        port: Number(port) || 587,
        username: username.trim(),
        from_email: fromEmail.trim(),
        use_tls: useTls,
        password: editingPassword && password.trim() ? password.trim() : undefined,
      });
      applyData(updated);
      toast.success("Integración de correo actualizada");
    } catch (err: unknown) {
      toast.error(errMsg(err, "No se pudieron guardar los cambios"));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testTo.trim()) {
      toast.error("Ingresá un correo para enviar la prueba");
      return;
    }
    setTesting(true);
    try {
      const result = await integrationsService.testEmailConnection(testTo.trim());
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      applyData(await integrationsService.getEmail());
    } catch (err: unknown) {
      toast.error(errMsg(err, "No se pudo enviar el correo de prueba"));
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-lg p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
            Correo — Envío de emails (SMTP)
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Se usa para la confirmación de cuenta y otros avisos. Si está inactiva, los correos
            sólo se registran en el log del servidor.
          </p>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer">
          <span className="text-xs font-medium text-[#4A4A4A]">{enabled ? "Activa" : "Inactiva"}</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={LABEL}>Host SMTP</label>
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.gmail.com"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Puerto</label>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="587"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className={LABEL}>Usuario</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario@tudominio.com"
          className={INPUT}
        />
      </div>

      <div>
        <label className={LABEL}>Contraseña</label>
        {editingPassword ? (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña o app password"
            className={INPUT}
          />
        ) : (
          <div className="flex items-center gap-3">
            <input value="•••••••• configurada" disabled className={INPUT} />
            <button
              type="button"
              onClick={() => setEditingPassword(true)}
              className="text-xs font-medium text-[#1A2B1C] hover:underline shrink-0"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      <div>
        <label className={LABEL}>Remitente (From)</label>
        <input
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="Vivero El Cristo <no-reply@tudominio.com>"
          className={INPUT}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#4A4A4A] cursor-pointer">
        <input
          type="checkbox"
          checked={useTls}
          onChange={(e) => setUseTls(e.target.checked)}
          className="w-4 h-4 rounded border-[#E8E2D8] accent-[#1A2B1C]"
        />
        Usar STARTTLS (recomendado para el puerto 587)
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex flex-col gap-3 pt-3 border-t border-[#F0EDE8]">
        <label className={LABEL}>Enviar un correo de prueba</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="destinatario@email.com"
            className={`${INPUT} sm:max-w-xs`}
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg disabled:opacity-50 shrink-0"
          >
            {testing ? "Enviando…" : "Enviar prueba"}
          </button>

          {data.last_verified_ok !== null && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                data.last_verified_ok
                  ? "bg-[#EAF3EA] text-[#2E5A2E]"
                  : "bg-[#FEF2F2] text-[#B91C1C]"
              }`}
            >
              {data.last_verified_ok ? "✓ " : "✕ "}
              {data.last_verified_message}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#ABABAB]">
          La prueba usa la configuración ya guardada. Guardá los cambios antes de probar.
        </p>
      </div>
    </div>
  );
}
