import { IAuthRepository } from "../../domain/repositories/auth.repository";
import { AuthCredentials, AccessToken, ApiResponse, RecoverPasswordPayload } from "../../domain/entities/auth";
import apiClient from "../sources/api.client";
import Cookies from "js-cookie";
import { Role } from "@/domain/entities/account";

export class AuthRepositoryImpl implements IAuthRepository {
  async login(credentials: AuthCredentials): Promise<AccessToken> {
    const response = await apiClient.post<unknown, ApiResponse<AccessToken>>("/auth/login", credentials);
    if (response.error) throw new Error(response.error);

    // Extrair roles do JWT (roles vêm como string[], ex: ["user"] ou ["user","moderator"])
    let roles: (string | Role)[] = response.data.roles || [];
    if (roles.length === 0 && response.data.access_token) {
      try {
        const payloadPart = response.data.access_token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        roles = payload.roles || [];
      } catch (e) {
        console.error("Falha ao decodificar papéis do Token:", e);
      }
    }

    // Armazenar tokens nos cookies
    Cookies.set("access_token", response.data.access_token, { expires: response.data.expires_in });
    if (response.data.refresh_token) {
      Cookies.set("refresh_token", response.data.refresh_token, { expires: response.data.expires_in * 7 });
    }

    // Detecta moderador — suporta string[] e {key,label}[]
    const isAdmin = roles.some(r => (typeof r === "string" ? r : r.key) === "moderator");
    const dataRoles: Role = isAdmin
      ? { key: "admin-user", label: "Administrador" }
      : { key: "user", label: "Usuário" };
    Cookies.set("role", JSON.stringify(dataRoles), { expires: response.data.expires_in });

    const resolvedRoles: Role[] = roles.map(r => {
      if (typeof r === "string") {
        return { key: r, label: r.charAt(0).toUpperCase() + r.slice(1) };
      }
      return r;
    });

    return { ...response.data, roles: resolvedRoles };
  }

  getRole(): Role | null {
    try {
      return JSON.parse(Cookies.get("role") as string) || null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return Cookies.get("access_token") || null;
  }

  getRefreshToken(): string | null {
    return Cookies.get("refresh_token") || null;
  }

  /** Troca o refresh_token por um novo access_token. Retorna o novo access_token. */
  async refreshToken(): Promise<string> {
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error("Sem refresh_token disponível.");

    const response = await apiClient.post<unknown, ApiResponse<AccessToken>>("/auth/refresh", {
      refresh_token: refresh,
    });
    if (response.error) throw new Error(response.error);

    Cookies.set("access_token", response.data.access_token, { expires: response.data.expires_in });
    if (response.data.refresh_token) {
      Cookies.set("refresh_token", response.data.refresh_token, { expires: response.data.expires_in * 7 });
    }

    return response.data.access_token;
  }

  logout(): void {
    this.removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  async recoverPassword(payload: RecoverPasswordPayload): Promise<void> {
    const response = await apiClient.post<unknown, ApiResponse<void>>("/auth/recover", payload);
    if (response.error) throw new Error(response.error);
  }

  removeToken(): void {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("role");
  }
}
