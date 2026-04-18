import { Role } from "./account";

export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
  roles?: Role[];
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RecoverPasswordPayload {
  identifier: string;
  recovery_email: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  meta: Record<string, any> | null;
}
