/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { createContext, useContext, useRef } from "react";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

interface ApiContextProps {
  PostAPI: (
    url: string,
    data: unknown,
    auth: boolean,
  ) => Promise<{ status: number; body: any }>;
  GetAPI: (
    url: string,
    auth: boolean,
  ) => Promise<{ status: number; body: any }>;
  PutAPI: (
    url: string,
    data: unknown,
    auth: boolean,
  ) => Promise<{ status: number; body: any }>;
  /** Endpoints /corporate/* usam PATCH para atualização parcial. */
  PatchAPI: (
    url: string,
    data: unknown,
    auth: boolean,
  ) => Promise<{ status: number; body: any }>;
  DeleteAPI: (
    url: string,
    auth: boolean,
  ) => Promise<{ status: number; body: any }>;
}

const ApiContext = createContext<ApiContextProps | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export const ApiContextProvider = ({ children }: ProviderProps) => {
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const api = axios.create({
    baseURL,
  });

  /**
   * Tenta renovar o access token via Route Handler /api/auth/refresh.
   * Retorna o novo access token ou null se falhar.
   */
  async function refreshAccessToken(): Promise<boolean> {
    // Se já está fazendo refresh, retorna a promise em andamento
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          // Refresh falhou — limpa sessão
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
          window.location.href = "/login";
          return false;
        }

        return true;
      } catch {
        window.location.href = "/login";
        return false;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }

  // Interceptor de response: auto-refresh em 401
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _requiresAuth?: boolean;
      };

      // Se recebeu 401 e é uma request autenticada que ainda não fez retry
      if (
        error.response?.status === 401 &&
        originalRequest._requiresAuth &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        const refreshed = await refreshAccessToken();

        if (refreshed) {
          originalRequest.headers.delete("Authorization");
          return api(originalRequest);
        }

        // Se refresh falhou, o refreshAccessToken já redireciona
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );

  function buildHeaders(_auth: boolean, isFormData = false) {
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "any",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  async function PostAPI(url: string, data: unknown, auth: boolean) {
    const isFormData = data instanceof FormData;
    const connect = await api
      .post(url, data, {
        headers: buildHeaders(auth, isFormData),
        _requiresAuth: auth,
      } as any)
      .then(({ data }) => ({ status: 200, body: data }))
      .catch((err) => {
        console.error(`❌ API Error [POST] ${url}`, err.response?.data || err);
        return {
          status: err.response?.status || 500,
          body: err.response?.data || "Erro desconhecido",
        };
      });
    return connect;
  }

  async function GetAPI(url: string, auth: boolean) {
    const connect = await api
      .get(url, {
        headers: buildHeaders(auth),
        _requiresAuth: auth,
      } as any)
      .then(({ data }) => ({ status: 200, body: data }))
      .catch((err) => {
        console.error(`❌ API Error [GET] ${url}`, err.response?.data || err);
        return {
          status: err.response?.status || 500,
          body: err.response?.data || "Erro desconhecido",
        };
      });
    return connect;
  }

  async function PutAPI(url: string, data: unknown, auth: boolean) {
    const connect = await api
      .put(url, data, {
        headers: buildHeaders(auth),
        _requiresAuth: auth,
      } as any)
      .then(({ data }) => ({ status: 200, body: data }))
      .catch((err) => {
        console.error(`❌ API Error [PUT] ${url}`, err.response?.data || err);
        return {
          status: err.response?.status || 500,
          body: err.response?.data || "Erro desconhecido",
        };
      });
    return connect;
  }

  async function PatchAPI(url: string, data: unknown, auth: boolean) {
    const connect = await api
      .patch(url, data, {
        headers: buildHeaders(auth),
        _requiresAuth: auth,
      } as any)
      .then(({ data }) => ({ status: 200, body: data }))
      .catch((err) => {
        console.error(`❌ API Error [PATCH] ${url}`, err.response?.data || err);
        return {
          status: err.response?.status || 500,
          body: err.response?.data || "Erro desconhecido",
        };
      });
    return connect;
  }

  async function DeleteAPI(url: string, auth: boolean) {
    const connect = await api
      .delete(url, {
        headers: buildHeaders(auth),
        _requiresAuth: auth,
      } as any)
      .then(({ data }) => ({ status: 200, body: data }))
      .catch((err) => {
        console.error(
          `❌ API Error [DELETE] ${url}`,
          err.response?.data || err,
        );
        return {
          status: err.response?.status || 500,
          body: err.response?.data || "Erro desconhecido",
        };
      });
    return connect;
  }

  return (
    <ApiContext.Provider
      value={{ PostAPI, GetAPI, PutAPI, PatchAPI, DeleteAPI }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export function useApiContext() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error(
      "useApiContext deve ser usado dentro de um ApiContextProvider",
    );
  }
  return context;
}
