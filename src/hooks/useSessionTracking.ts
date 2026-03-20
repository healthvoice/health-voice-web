"use client";

import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { endSession, pingSession } from "@/services/analyticsService";
import { useEffect, useRef } from "react";

/**
 * Configuração do intervalo de ping (padrão: 30 segundos)
 * Pode ser configurado via variável de ambiente NEXT_PUBLIC_SESSION_PING_INTERVAL
 */
const PING_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_SESSION_PING_INTERVAL || "30000", 10) || 30000;

/**
 * Hook para gerenciar tracking de sessão:
 * - Envia pings periódicos enquanto sessão está ativa
 * - Finaliza sessão ao fechar aba (beforeunload)
 * - Finaliza sessão ao fazer logout
 */
export function useSessionTracking() {
  const { PostAPI } = useApiContext();
  const { sessionId, setSessionId } = useTrackingContext();
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enviar ping periódico enquanto sessão está ativa
  useEffect(() => {
    if (!sessionId) {
      // Limpar intervalo se não há sessão
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    // Enviar primeiro ping imediatamente
    pingSession(PostAPI, sessionId).catch(() => {
      // Erros são silenciosos
    });

    // Configurar intervalo para enviar pings periódicos
    pingIntervalRef.current = setInterval(() => {
      if (sessionId) {
        pingSession(PostAPI, sessionId).catch(() => {
          // Erros são silenciosos
        });
      }
    }, PING_INTERVAL_MS);

    // Limpar intervalo ao desmontar ou quando sessionId mudar
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [sessionId, PostAPI]);

  // Finalizar sessão ao fechar aba (beforeunload)
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const handleBeforeUnload = () => {
      // Usar fetch com keepalive para garantir que a requisição seja enviada mesmo ao fechar aba
      // keepalive permite que a requisição continue mesmo após a página ser descarregada
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        if (!apiUrl) {
          return;
        }

        const url = `${apiUrl}/analytics/session/end`;
        const data = {
          sessionId,
          endedAt: new Date().toISOString(),
        };

        // Usar fetch com keepalive (mais confiável que sendBeacon para requisições autenticadas)
        // O navegador garante que a requisição seja enviada mesmo após a página ser descarregada
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          keepalive: true, // Permite que a requisição continue após a página ser descarregada
          credentials: "include", // Inclui cookies (token de autenticação)
        }).catch(() => {
          // Erros são silenciosos - não há nada que possamos fazer se falhar
        });
      } catch (error) {
        // Erros são silenciosos
        if (process.env.NODE_ENV === "development") {
          console.error("Erro ao finalizar sessão no beforeunload:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionId]);

  /**
   * Função para finalizar sessão manualmente (ex: no logout)
   */
  const finalizeSession = async () => {
    if (!sessionId) {
      return;
    }

    // Limpar intervalo de ping
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Finalizar sessão no backend
    await endSession(PostAPI, sessionId);

    // Limpar sessionId do contexto
    setSessionId(null);
  };

  return {
    finalizeSession,
  };
}
