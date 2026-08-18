export interface Address {
  address_id: string;
  full_name: string;
  phone_country_code: string;
  phone: string;
  street: string;
  no_number: boolean;
  province: string;
  locality: string;
  zip: string | null;
  zip_unknown: boolean;
  department: string | null;
  is_default: boolean;
  created_at: string;
}

export interface AddressInput {
  full_name: string;
  phone_country_code?: string;
  phone: string;
  street: string;
  no_number?: boolean;
  province: string;
  locality: string;
  zip?: string | null;
  zip_unknown?: boolean;
  department?: string | null;
  is_default?: boolean;
}

// Las 24 provincias argentinas (23 provincias + CABA).
export const ARGENTINE_PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;
