/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { fetchAuthSession } from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import axios from "axios";
import { createContext, useContext } from "react";
import config from "../utils/amplify.json";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

console.log(baseURL);
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
  Amplify.configure(config);

  const api = axios.create({
    baseURL,
  });

  async function header(auth: boolean, isFormData = false) {
    let token = null;

    if (auth) {
      try {
        const session = await fetchAuthSession();

        token = session.tokens?.accessToken.toString();
      } catch (error) {
        console.error("Não foi possível obter a sessão do Cognito (v6)", error);
      }
    }

    const headers: Record<string, string> = {
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "any",
    };

    // Não define Content-Type para FormData, deixa o axios fazer isso automaticamente
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return { headers };
  }

  async function PostAPI(url: string, data: unknown, auth: boolean) {
    const isFormData = data instanceof FormData;
    const connect = await api
      .post(url, data, await header(auth, isFormData))
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
      .get(url, await header(auth))
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
      .put(url, data, await header(auth))
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

  async function DeleteAPI(url: string, auth: boolean) {
    const connect = await api
      .delete(url, await header(auth))
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
    <ApiContext.Provider value={{ PostAPI, GetAPI, PutAPI, DeleteAPI }}>
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
