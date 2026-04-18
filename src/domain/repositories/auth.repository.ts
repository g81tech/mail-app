import { Role } from "../entities/account";
import { AccessToken, AuthCredentials, RecoverPasswordPayload } from "../entities/auth";

export interface IAuthRepository {
  login(credentials: AuthCredentials): Promise<AccessToken>;
  logout(): void;
  getToken(): string | null;
  getRefreshToken(): string | null;
  getRole(): Role | null;
  removeToken(): void;
  refreshToken(): Promise<string>;
  recoverPassword(payload: RecoverPasswordPayload): Promise<void>;
}
