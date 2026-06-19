export type Role = "student" | "faculty" | "admin" | "super_admin";

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  tenant_id: number;
  is_active: boolean;
  is_verified: boolean;
  tenant?: Tenant;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
}
