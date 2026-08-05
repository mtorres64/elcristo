export interface User {
  user_id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "platform_admin";
  is_active: boolean;
  email_verified: boolean;
  avatar_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface UserListParams {
  q?: string;
  role?: string;
  is_active?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: "buyer" | "seller" | "platform_admin";
  is_active: boolean;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "buyer" | "seller" | "platform_admin";
  is_active?: boolean;
}
