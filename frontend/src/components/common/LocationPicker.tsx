import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { searchAddress } from "../../utils/geolocation";
import type { AddressSearchResult } from "../../utils/geolocation";

// Vite empaqueta los íconos de Leaflet con hashes propios; sin este fix el
// pin por defecto queda roto (busca las imágenes en la ruta original).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// San Miguel de Tucumán — centro por defecto hasta que haya un pin.
const DEFAULT_CENTER: [number, number] = [-26.8241, -65.2226];

interface Props {
  position: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

/** Mapa con pin: click para ponerlo, arrastre para reubicarlo. El mapa se
 * recentra solo si la posición cambia desde afuera (ej. "Usar mi ubicación"). */
export function LocationPicker({ position, onChange, className = "h-64" }: Props) {
  return (
    <div className={`rounded-lg overflow-hidden border border-[#E8E2D8] ${className}`}>
      <MapContainer
        center={position ?? DEFAULT_CENTER}
        zoom={position ? 16 : 12}
        style={{ height: "100%", width: "100%" }}
        // En táctil el arrastre con un dedo movería el mapa y bloquearía el
        // scroll de la página; el pin se ubica con toque o arrastrando el marker.
        dragging={!L.Browser.mobile}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PinLayer position={position} onChange={onChange} />
      </MapContainer>
    </div>
  );
}

function PinLayer({ position, onChange }: Pick<Props, "position" | "onChange">) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const lat = position?.[0];
  const lng = position?.[1];
  useEffect(() => {
    if (lat == null || lng == null) return;
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [lat, lng, map]);

  if (!position) return null;
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onChange(lat, lng);
        },
      }}
    />
  );
}

/** Buscador con autocompletar que además ES el campo de dirección: no hay un
 * input de "Dirección" aparte, para no confundir con dos cuadros para lo
 * mismo. `value`/`onChange` son la calle tal cual queda en el formulario —
 * se puede escribir a mano (sin elegir sugerencia) o completar eligiendo un
 * resultado, que además centra el mapa con el pin puesto. */
export function AddressSearchBox({
  value,
  onChange,
  onSelect,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressSearchResult) => void;
  disabled?: boolean;
}) {
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Evita que una búsqueda vieja (lenta) pise el resultado de una más nueva.
  const requestId = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchAddress(q);
        if (requestId.current !== id) return;
        setResults(found);
        setOpen(true);
      } catch {
        if (requestId.current === id) setResults([]);
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSelect(result: AddressSearchResult) {
    onSelect(result);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        // El blur se dispara antes que el click de la lista; el delay deja
        // que el onClick de la sugerencia se procese primero.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder="Ej: Belgrano 450, San Miguel de Tucumán"
        required
        className="w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors disabled:opacity-50 disabled:bg-[#F9F8F5]"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#ABABAB]">Buscando...</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 w-full rounded-lg border border-[#E8E2D8] bg-white shadow-lg max-h-56 overflow-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                // preventDefault en vez de depender sólo del delay del blur:
                // sin esto el input pierde foco antes de disparar el click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3.5 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F8F5] transition-colors"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Mapa de solo lectura con el pin en un punto fijo (ej. detalle de pedido en el admin). */
export function LocationViewer({ lat, lng, className = "h-56" }: { lat: number; lng: number; className?: string }) {
  return (
    <div className={`rounded-lg overflow-hidden border border-[#E8E2D8] ${className}`}>
      <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} dragging={!L.Browser.mobile}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
