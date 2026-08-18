import { useState } from "react";
import toast from "react-hot-toast";
import { ARGENTINE_PROVINCES } from "../../types/address";
import type { AddressInput } from "../../types/address";
import { geolocateAddress } from "../../utils/geolocation";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors disabled:opacity-50 disabled:bg-[#F9F8F5]";

const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

interface Props {
  initial?: Partial<AddressInput>;
  onCancel: () => void;
  onSave: (data: AddressInput) => Promise<void>;
  hasExistingAddresses: boolean;
}

export function AddressForm({ initial, onCancel, onSave, hasExistingAddresses }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [noNumber, setNoNumber] = useState(initial?.no_number ?? false);
  const [province, setProvince] = useState(initial?.province ?? "");
  const [locality, setLocality] = useState(initial?.locality ?? "");
  const [zip, setZip] = useState(initial?.zip ?? "");
  const [zipUnknown, setZipUnknown] = useState(initial?.zip_unknown ?? false);
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? !hasExistingAddresses);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await geolocateAddress();
      setStreet(result.street);
      setNoNumber(!result.hasNumber);
      if (result.locality) setLocality(result.locality);
      if (result.province) setProvince(result.province);
      if (result.zip) {
        setZip(result.zip);
        setZipUnknown(false);
      }
      toast.success("Dirección completada. Revisala antes de guardar.");
    } catch (err) {
      const message = err instanceof GeolocationPositionError
        ? "No pudimos acceder a tu ubicación. Revisá los permisos del navegador."
        : "No pudimos completar la dirección automáticamente. Cargala a mano.";
      toast.error(message);
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !street.trim() || !province || !locality.trim()) {
      toast.error("Completá los campos obligatorios");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        full_name: fullName.trim(),
        phone_country_code: "+54",
        phone: phone.trim(),
        street: street.trim(),
        no_number: noNumber,
        province,
        locality: locality.trim(),
        zip: zipUnknown ? null : zip.trim() || null,
        zip_unknown: zipUnknown,
        department: department.trim() || null,
        is_default: isDefault,
      });
    } catch {
      toast.error("No se pudo guardar la dirección");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={locating}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#EAF0FA] text-[#2D4F8A] text-sm font-medium py-3 px-4 hover:bg-[#DCE7F8] transition-colors disabled:opacity-60"
      >
        <LocationIcon spinning={locating} />
        {locating ? "Buscando tu ubicación..." : "Usar mi ubicación"}
      </button>

      <div>
        <label className={LABEL}>Dirección</label>
        <input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Ej: Avenida Manuel Belgrano"
          className={INPUT}
          required
        />
        <label className="flex items-center gap-2 mt-2 text-xs text-[#6B6B6B] cursor-pointer">
          <input
            type="checkbox"
            checked={noNumber}
            onChange={(e) => setNoNumber(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
          />
          La calle no tiene número
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Provincia</label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={`${INPUT} appearance-none cursor-pointer`}
            required
          >
            <option value="" disabled>
              Seleccioná una provincia
            </option>
            {ARGENTINE_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Localidad / Barrio</label>
          <input
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="Ej: San Miguel de Tucumán"
            className={INPUT}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Código Postal</label>
          <div className="flex items-center gap-2">
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="4000"
              disabled={zipUnknown}
              className={INPUT}
            />
            <label className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B] whitespace-nowrap cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={zipUnknown}
                onChange={(e) => {
                  setZipUnknown(e.target.checked);
                  if (e.target.checked) setZip("");
                }}
                className="w-3.5 h-3.5 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
              />
              No sé mi CP
            </label>
          </div>
        </div>
        <div>
          <label className={LABEL}>
            Departamento <span className="text-[#ABABAB] font-normal">(opcional)</span>
          </label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Ej: 201"
            className={INPUT}
          />
        </div>
      </div>

      <p className="text-xs font-semibold text-[#1A1A1A] mt-2">Datos de contacto</p>

      <div>
        <label className={LABEL}>Nombre y apellido</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          className={INPUT}
          required
        />
      </div>

      <div>
        <label className={LABEL}>Teléfono</label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-lg border border-[#E8E2D8] bg-[#F9F8F5] px-3 py-2.5 text-sm text-[#4A4A4A] font-medium">
            AR +54
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0381 515-6095"
            className={INPUT}
            required
          />
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 mt-1">
        <span className="text-sm text-[#1A1A1A]">Elegir como predeterminada</span>
        <span
          role="switch"
          aria-checked={isDefault}
          onClick={() => setIsDefault((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
            isDefault ? "bg-[#1A2B1C]" : "bg-[#E8E2D8]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              isDefault ? "translate-x-5" : ""
            }`}
          />
        </span>
      </label>

      <div className="flex items-center justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function LocationIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={spinning ? "animate-spin" : ""}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
