import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

/** Mapa de solo lectura con el pin en un punto fijo (ej. detalle de pedido en el admin). */
export function LocationViewer({ lat, lng, className = "h-56" }: { lat: number; lng: number; className?: string }) {
  return (
    <div className={`rounded-lg overflow-hidden border border-[#E8E2D8] ${className}`}>
      <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
