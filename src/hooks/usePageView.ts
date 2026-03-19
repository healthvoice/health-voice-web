"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";

interface PostAPIFunction {
  (
    url: string,
    data: unknown,
    auth: boolean,
  ): Promise<{ status: number; body: any }>;
}

export function usePageView(
  screenName?: string,
  detailType?: string,
  detailId?: string
) {
  const pathname = usePathname();
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset quando a rota muda
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;

    const finalScreenName = screenName || pathname;

    if (process.env.NODE_ENV === "development") {
      console.log("👁️ [Tracking] Visualização de tela iniciada:", {
        screenName: finalScreenName,
        detailType,
        detailId,
        timestamp: new Date().toISOString(),
      });
    }

    // Função de cleanup que rastreia o tempo na tela
    return () => {
      if (hasTrackedRef.current) return; // Evitar tracking duplicado
      
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (process.env.NODE_ENV === "development") {
        console.log("👁️ [Tracking] Visualização de tela finalizada:", {
          screenName: finalScreenName,
          timeSpent: `${timeSpent}s`,
        });
      }

      // Enviar tracking apenas se tiver sessionId
      if (sessionId) {
        hasTrackedRef.current = true; // Marcar como rastreado antes de enviar
        trackPageView(
          PostAPI,
          sessionId,
          finalScreenName,
          timeSpent,
          detailType,
          detailId
        ).catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [Tracking] Erro ao rastrear visualização:", error);
          }
          hasTrackedRef.current = false; // Resetar em caso de erro para tentar novamente
        });
      }
    };
  }, [pathname, screenName, detailType, detailId, sessionId, PostAPI]);
}

async function trackPageView(
  PostAPI: PostAPIFunction,
  sessionId: string,
  screenName: string,
  timeSpent: number,
  detailType?: string,
  detailId?: string
) {
  try {
    const metadata: Record<string, unknown> = {
      screenName,
      timeSpent,
    };

    if (detailType) {
      metadata.detailType = detailType;
    }
    if (detailId) {
      metadata.detailId = detailId;
    }

    const response = await PostAPI(
      "/analytics/actions",
      {
        actionType: "SCREEN_VIEWED",
        platform: Platform.WEB,
        metadata,
      },
      true
    );

    if (response.status === 200 || response.status === 201) {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ [Tracking] Visualização de tela rastreada com sucesso");
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ [Tracking] Falha ao rastrear visualização:", response.status);
      }
    }
  } catch (error) {
    // Erro silencioso - não deve quebrar a aplicação
    if (process.env.NODE_ENV === "development") {
      console.error("❌ [Tracking] Erro ao rastrear visualização:", error);
    }
  }
}
