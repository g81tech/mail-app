"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthRepositoryImpl } from "@/data/repositories/auth.repository.impl";
import { AuthCredentials } from "@/domain/entities/auth";
import { Role } from "@/domain/entities/account";

interface AuthContextType {
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  greetingMessage: () => string;
  login: (credentials: AuthCredentials) => Promise<Role>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  recoverPassword: (payload: { identifier: string; recovery_email: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authRepository = new AuthRepositoryImpl();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = authRepository.getToken();
    const savedRole = authRepository.getRole();

    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials): Promise<Role> => {
    const data = await authRepository.login(credentials);
    setToken(data.access_token);

    // O repositório já resolveu e salvou o role correto no cookie.
    // Usamos ele como fonte de verdade para evitar divergência caso
    // data.roles venha vazio mas o cookie tenha sido populado via JWT decode.
    const savedRole = authRepository.getRole();
    const resolvedRole: Role = savedRole ?? (
      data?.roles?.some(r => r.key === "moderator")
        ? { key: "admin-user", label: "Administrador" }
        : { key: "user", label: "Usuário" }
    );
    setRole(resolvedRole);
    return resolvedRole;
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const newToken = await authRepository.refreshToken();
      setToken(newToken);
    } catch {
      authRepository.removeToken();
      setToken(null);
      setRole(null);
    }
  }, []);

  const recoverPassword = useCallback(async (payload: { identifier: string; recovery_email: string }) => {
    await authRepository.recoverPassword(payload);
  }, []);

  const logout = useCallback(() => {
    authRepository.logout();
    setToken(null);
    setRole(null);
  }, []);

  const greetingMessage = () => {
    const hours = new Date().getHours();
    if (hours <= 5) return "Boa madrugada!";
    if (hours < 12) return "Bom dia!";
    if (hours < 18) return "Boa tarde!";
    return "Boa noite!";
  };


  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isAuthenticated: !!token,
        isLoading,
        greetingMessage,
        login,
        logout,
        refreshToken,
        recoverPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
