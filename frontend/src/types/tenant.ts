export interface TenantPublic {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  categories: string[];
  status: string;
}
