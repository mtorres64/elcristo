import { PAGE_SIZE_OPTIONS } from "../../hooks/usePageSize";

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-[#8A8A8A] whitespace-nowrap">
      Mostrar
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-[#E8E2D8] px-2 py-1 text-xs text-[#4A4A4A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors cursor-pointer"
      >
        {PAGE_SIZE_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      por página
    </label>
  );
}
