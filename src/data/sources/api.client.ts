import { AccessToken } from "@/domain/entities/auth";
import axios from "axios";
import Cookies from "js-cookie";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1",
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Controla se já estamos tentando um refresh para evitar loops infinitos
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshDone(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = Cookies.get("refresh_token");

      // Sem refresh_token: logout imediato
      if (!refreshToken) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("role");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error.response?.data || { error: "Sessão expirada." });
      }

      // Se já estamos fazendo refresh, enfileira a requisição
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = newToken;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ data: AccessToken } | AccessToken>(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1"}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        // A resposta já é o dado puro (o interceptor de request não aplica aqui pois usamos axios direto)
        const responseData = "data" in refreshResponse.data && refreshResponse.data.data
          ? (refreshResponse.data.data as AccessToken)
          : (refreshResponse.data as AccessToken);

        const newAccessToken: string = responseData.access_token;
        const newRefreshToken: string | undefined = responseData.refresh_token;
        const expiresIn: number = responseData.expires_in ?? 1;

        Cookies.set("access_token", newAccessToken, { expires: expiresIn });
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { expires: expiresIn * 7 });
        }

        // Atualiza a requisição original e notifica as enfileiradas
        originalRequest.headers.Authorization = newAccessToken;
        onRefreshDone(newAccessToken);

        return apiClient(originalRequest);
      } catch {
        // Refresh falhou: logout total
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("role");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject({ error: "Sessão expirada. Faça login novamente." });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || { error: "Erro na conexão com o servidor." });
  }
);

export default apiClient;
