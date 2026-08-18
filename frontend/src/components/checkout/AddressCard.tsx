import type { Address } from "../../types/address";

export function AddressCard({
  address,
  selected,
  onSelect,
  onDelete,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const zipLabel = address.zip_unknown ? "CP a confirmar" : address.zip;
  const numberLabel = address.no_number ? "sin número" : "";

  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
        selected ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#C8C0B4] bg-white"
      }`}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="mt-1 w-4 h-4 accent-[#1A2B1C] cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {address.street} {numberLabel}
          </p>
          {address.is_default && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#3D6040] bg-[#E8F0E8] px-2 py-0.5 rounded-full">
              Predeterminada
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B] mt-0.5">
          {address.locality}, {address.province} {zipLabel ? `(${zipLabel})` : ""}
        </p>
        <p className="text-xs text-[#8A8A8A] mt-1">
          {address.full_name} · {address.phone_country_code} {address.phone}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
        aria-label="Eliminar dirección"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
        </svg>
      </button>
    </label>
  );
}
